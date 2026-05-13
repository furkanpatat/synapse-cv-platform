"""RabbitMQ consumer that runs CV-vs-GitHub AI analysis asynchronously.

Subscribes to `analysis.run`, performs the same logic the synchronous
/v1/analysis/run endpoint did, then publishes a result envelope to
`analysis.complete` for the Spring backend to persist + push notification.

Designed to run in a daemon thread alongside FastAPI uvicorn — failures are
logged and a single failed message is acked with a FAILED status so the
backend always closes the loop.
"""

from __future__ import annotations

import json
import threading
import time
from typing import Any

import pika
from loguru import logger

from app.config import settings
from app.analysis import github as github_mod
from app.analysis import verifier as verifier_mod

ANALYSIS_RUN = "analysis.run"
ANALYSIS_COMPLETE = "analysis.complete"


def _publish_result(channel, body: dict[str, Any]) -> None:
    channel.queue_declare(queue=ANALYSIS_COMPLETE, durable=True)
    channel.basic_publish(
        exchange="",
        routing_key=ANALYSIS_COMPLETE,
        body=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        properties=pika.BasicProperties(content_type="application/json", delivery_mode=2),
    )


def _process(channel, body: bytes) -> None:
    msg = json.loads(body)
    report_id = msg.get("reportId")
    user_id = msg.get("userId")
    github_username = msg.get("githubUsername")
    cv_skills = msg.get("cvSkills") or []

    logger.info("[worker] consuming report={} github={}", report_id, github_username)

    try:
        github_data = github_mod.fetch_profile(github_username)
        result = verifier_mod.verify_skills(cv_skills, github_data)

        envelope = {
            "reportId": report_id,
            "userId": user_id,
            "status": "COMPLETED",
            "githubUsername": github_username,
            "github": {
                "publicRepos": github_data.get("publicRepos"),
                "totalStars": github_data.get("totalStars"),
                "languageBytes": github_data.get("languageBytes"),
                "topRepos": github_data.get("topRepos"),
                "accountCreatedAt": github_data.get("accountCreatedAt"),
                "lastActivityAt": github_data.get("lastActivityAt"),
            },
            "overallScore": result.get("overallScore"),
            "summary": result.get("summary"),
            "skillScores": result.get("skillScores"),
            "inconsistencies": result.get("inconsistencies"),
        }
        _publish_result(channel, envelope)
        logger.info("[worker] published COMPLETED for report={}", report_id)

    except Exception as ex:
        logger.exception("[worker] analysis failed for report={}: {}", report_id, ex)
        _publish_result(
            channel,
            {
                "reportId": report_id,
                "userId": user_id,
                "status": "FAILED",
                "errorMessage": str(ex),
            },
        )


def _consume_forever() -> None:
    """Long-lived consumer with reconnect."""
    while True:
        try:
            params = pika.URLParameters(settings.rabbitmq_url)
            params.heartbeat = 30
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.queue_declare(queue=ANALYSIS_RUN, durable=True)
            channel.basic_qos(prefetch_count=1)

            logger.info("[worker] connected to RabbitMQ, waiting for {} messages...", ANALYSIS_RUN)

            def callback(ch, method, _props, body):
                try:
                    _process(ch, body)
                finally:
                    ch.basic_ack(delivery_tag=method.delivery_tag)

            channel.basic_consume(queue=ANALYSIS_RUN, on_message_callback=callback)
            channel.start_consuming()
        except Exception as ex:
            logger.error("[worker] RabbitMQ loop error, retrying in 5s: {}", ex)
            time.sleep(5)


def start_worker_in_background() -> threading.Thread:
    """Start consumer in a daemon thread so it dies with the uvicorn process."""
    t = threading.Thread(target=_consume_forever, name="analysis-worker", daemon=True)
    t.start()
    logger.info("[worker] analysis-worker thread started")
    return t

package com.cvplatform.analysis.queue;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalysisJobProducer {

    private final RabbitTemplate rabbitTemplate;

    public void enqueue(AnalysisJobMessage msg) {
        log.info("Enqueueing analysis job report={} user={}", msg.reportId(), msg.userId());
        rabbitTemplate.convertAndSend(RabbitConfig.ANALYSIS_RUN_QUEUE, msg);
    }
}

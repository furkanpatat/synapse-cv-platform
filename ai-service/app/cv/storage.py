"""MinIO download helper."""

from urllib.parse import urlparse

from minio import Minio

from app.config import settings


def _make_client() -> Minio:
    endpoint = settings.minio_endpoint
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        parsed = urlparse(endpoint)
        host = f"{parsed.hostname}:{parsed.port or (443 if parsed.scheme == 'https' else 80)}"
        secure = parsed.scheme == "https"
    else:
        host = endpoint
        secure = False
    return Minio(
        host,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=secure,
    )


def download(object_name: str) -> bytes:
    client = _make_client()
    response = client.get_object(settings.minio_bucket, object_name)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()

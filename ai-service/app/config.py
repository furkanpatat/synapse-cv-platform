from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    github_token: str = ""

    mongo_uri: str = "mongodb://cvp:cvp_dev_pass@localhost:27017/cvplatform?authSource=admin"
    rabbitmq_url: str = "amqp://cvp:cvp_dev_pass@localhost:5672/"

    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "cvp"
    minio_secret_key: str = "cvp_dev_pass"
    minio_bucket: str = "cv-files"

    cors_allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]


settings = Settings()

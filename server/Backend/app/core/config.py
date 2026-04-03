from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Madrigal Backend"
    app_version: str = "0.1.0"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_secret_key: str = "change_me"

    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "madrigal"
    postgres_user: str = "madrigal"
    postgres_password: str = "change_me"

    redis_host: str = "redis"
    redis_port: int = 6379

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

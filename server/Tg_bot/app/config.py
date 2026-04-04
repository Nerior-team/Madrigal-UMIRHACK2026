from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    telegram_bot_token: str = "change_me"
    telegram_webhook_secret: str = "change_me"
    telegram_internal_signing_secret: str | None = None
    backend_base_url: str = "http://backend:8000"
    redis_host: str = "redis"
    redis_port: int = 6379
    bot_state_ttl_seconds: int = 1800
    bot_auth_poll_interval_seconds: int = 5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    @property
    def effective_telegram_internal_signing_secret(self) -> str:
        return (self.telegram_internal_signing_secret or self.telegram_webhook_secret).strip()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

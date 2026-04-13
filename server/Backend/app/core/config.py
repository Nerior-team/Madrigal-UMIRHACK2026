from functools import lru_cache

from cryptography.fernet import Fernet
from pydantic import ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Madrigal Backend"
    app_version: str = "0.1.0"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_secret_key: str
    backend_allowed_origins: str
    backend_cookie_name: str = "predict_mv_session"
    backend_cookie_secure: bool = False
    backend_cookie_domain: str | None = None
    backend_csrf_cookie_name: str = "predict_mv_csrf"
    backend_csrf_header_name: str = "X-CSRF-Token"

    postgres_host: str
    postgres_port: int
    postgres_db: str
    postgres_user: str
    postgres_password: str

    redis_host: str
    redis_port: int

    public_web_base_url: str

    auth_access_token_ttl_minutes: int = 30
    auth_web_session_ttl_days: int = 3
    auth_refresh_token_ttl_days: int = 30
    auth_email_code_ttl_minutes: int = 10
    auth_password_reset_ttl_minutes: int = 60
    auth_challenge_ttl_minutes: int = 10
    auth_reauth_ttl_minutes: int = 10
    auth_code_max_attempts: int = 5
    auth_endpoint_rate_limit_window_seconds: int = 60
    auth_endpoint_rate_limit_max_requests: int = 30
    auth_login_lockout_threshold: int = 5
    auth_login_lockout_seconds: int = 900
    auth_totp_lockout_threshold: int = 5
    auth_totp_lockout_seconds: int = 600
    auth_reauth_lockout_threshold: int = 5
    auth_reauth_lockout_seconds: int = 600
    machine_registration_ttl_minutes: int = 15
    machine_invite_ttl_hours: int = 72
    machine_heartbeat_stale_minutes: int = 5

    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_pass: str
    email_from: str
    support_email: str
    brand_display_name: str

    telegram_bot_token: str
    telegram_webhook_secret: str
    telegram_bot_username: str
    telegram_link_ttl_minutes: int = 15
    telegram_internal_signing_secret: str | None = None
    internal_request_ttl_seconds: int = 300

    data_encryption_key: str
    api_key_pepper: str

    tls_cert_path: str = "/run/secrets/server.crt"
    tls_key_path: str = "/run/secrets/server.key"
    tls_ca_path: str = "/run/secrets/ca.crt"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    @field_validator(
        "backend_secret_key",
        "postgres_host",
        "postgres_db",
        "postgres_user",
        "postgres_password",
        "redis_host",
        "backend_allowed_origins",
        "public_web_base_url",
        "smtp_host",
        "smtp_user",
        "smtp_pass",
        "email_from",
        "support_email",
        "brand_display_name",
        "telegram_bot_token",
        "telegram_webhook_secret",
        "telegram_bot_username",
        "api_key_pepper",
        mode="before",
    )
    @classmethod
    def validate_required_strings(cls, value: str, info: ValidationInfo) -> str:
        normalized = str(value).strip()
        if not normalized:
            raise ValueError(f"{info.field_name} must be provided")

        blocked_values = {
            "backend_secret_key": {"change_me", "key"},
            "postgres_password": {"change_me", "password"},
            "smtp_user": {"your-mail@yandex.ru"},
            "smtp_pass": {"replace-with-app-password", "change_me"},
            "email_from": {"your-mail@yandex.ru"},
            "support_email": {"support@predictmv.local"},
            "telegram_bot_token": {"change_me", "api"},
            "telegram_webhook_secret": {"change_me", "key"},
            "telegram_bot_username": {"change_me", "username"},
            "api_key_pepper": {"change_me", "key"},
        }
        if normalized in blocked_values.get(info.field_name, set()):
            raise ValueError(f"{info.field_name} contains a placeholder value")
        return normalized

    @field_validator("telegram_internal_signing_secret", mode="before")
    @classmethod
    def normalize_optional_secret(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

    @field_validator("backend_cookie_domain", mode="before")
    @classmethod
    def normalize_optional_cookie_domain(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

    @field_validator("data_encryption_key", mode="before")
    @classmethod
    def validate_data_encryption_key(cls, value: str) -> str:
        normalized = str(value).strip()
        if not normalized or normalized == "replace_with_fernet_key":
            raise ValueError("data_encryption_key contains a placeholder value")
        try:
            Fernet(normalized.encode("utf-8"))
        except (TypeError, ValueError) as exc:
            raise ValueError("data_encryption_key must be a valid Fernet key") from exc
        return normalized

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_allowed_origins.split(",") if origin.strip()]

    @property
    def effective_telegram_internal_signing_secret(self) -> str:
        return (self.telegram_internal_signing_secret or self.telegram_webhook_secret).strip()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

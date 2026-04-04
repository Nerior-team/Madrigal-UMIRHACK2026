from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Madrigal Backend"
    app_version: str = "0.1.0"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_secret_key: str = "change_me"
    backend_allowed_origins: str = "http://localhost:3000"
    backend_cookie_name: str = "predict_mv_session"
    backend_cookie_secure: bool = False

    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "madrigal"
    postgres_user: str = "madrigal"
    postgres_password: str = "change_me"

    redis_host: str = "redis"
    redis_port: int = 6379

    public_web_base_url: str = "http://localhost:3000"

    auth_access_token_ttl_minutes: int = 30
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

    smtp_host: str = "smtp.yandex.ru"
    smtp_port: int = 465
    smtp_user: str = "your-mail@yandex.ru"
    smtp_pass: str = "replace-with-app-password"
    email_from: str = "your-mail@yandex.ru"
    support_email: str = "support@predictmv.local"
    brand_display_name: str = "Predict MV"

    telegram_bot_token: str = "change_me"
    telegram_webhook_secret: str = "change_me"
    telegram_bot_username: str = "change_me"

    data_encryption_key: str = "replace_with_fernet_key"
    api_key_pepper: str = "change_me"

    tls_cert_path: str = "/run/secrets/server.crt"
    tls_key_path: str = "/run/secrets/server.key"
    tls_ca_path: str = "/run/secrets/ca.crt"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_allowed_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

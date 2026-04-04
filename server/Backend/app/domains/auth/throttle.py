from redis.exceptions import RedisError

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import normalize_email
from app.infra.redis import limits as redis_limits


def _safe_token(value: str | None) -> str:
    if not value:
        return "unknown"
    return value.strip().lower().replace(" ", "_")


def _login_fail_key(*, email: str, ip_address: str | None) -> str:
    return f"auth:login:fail:{normalize_email(email)}:{_safe_token(ip_address)}"


def _login_block_key(*, email: str, ip_address: str | None) -> str:
    return f"auth:login:block:{normalize_email(email)}:{_safe_token(ip_address)}"


def _totp_fail_key(*, challenge_id: str, ip_address: str | None) -> str:
    return f"auth:totp:fail:{challenge_id}:{_safe_token(ip_address)}"


def _totp_block_key(*, challenge_id: str, ip_address: str | None) -> str:
    return f"auth:totp:block:{challenge_id}:{_safe_token(ip_address)}"


def _reauth_fail_key(*, user_id: str, ip_address: str | None) -> str:
    return f"auth:reauth:fail:{user_id}:{_safe_token(ip_address)}"


def _reauth_block_key(*, user_id: str, ip_address: str | None) -> str:
    return f"auth:reauth:block:{user_id}:{_safe_token(ip_address)}"


class AuthThrottleService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def ensure_login_allowed(self, *, email: str, ip_address: str | None) -> None:
        self._ensure_not_blocked(
            key=_login_block_key(email=email, ip_address=ip_address),
            code="login_locked",
            message="Слишком много неудачных попыток входа. Попробуйте позже.",
        )

    def record_login_failure(self, *, email: str, ip_address: str | None) -> None:
        self._record_failure(
            fail_key=_login_fail_key(email=email, ip_address=ip_address),
            block_key=_login_block_key(email=email, ip_address=ip_address),
            threshold=self.settings.auth_login_lockout_threshold,
            block_seconds=self.settings.auth_login_lockout_seconds,
        )

    def clear_login_failures(self, *, email: str, ip_address: str | None) -> None:
        self._clear_keys(
            _login_fail_key(email=email, ip_address=ip_address),
            _login_block_key(email=email, ip_address=ip_address),
        )

    def ensure_totp_allowed(self, *, challenge_id: str, ip_address: str | None) -> None:
        self._ensure_not_blocked(
            key=_totp_block_key(challenge_id=challenge_id, ip_address=ip_address),
            code="totp_locked",
            message="Слишком много неверных TOTP-кодов. Попробуйте позже.",
        )

    def record_totp_failure(self, *, challenge_id: str, ip_address: str | None) -> None:
        self._record_failure(
            fail_key=_totp_fail_key(challenge_id=challenge_id, ip_address=ip_address),
            block_key=_totp_block_key(challenge_id=challenge_id, ip_address=ip_address),
            threshold=self.settings.auth_totp_lockout_threshold,
            block_seconds=self.settings.auth_totp_lockout_seconds,
        )

    def clear_totp_failures(self, *, challenge_id: str, ip_address: str | None) -> None:
        self._clear_keys(
            _totp_fail_key(challenge_id=challenge_id, ip_address=ip_address),
            _totp_block_key(challenge_id=challenge_id, ip_address=ip_address),
        )

    def ensure_reauth_allowed(self, *, user_id: str, ip_address: str | None) -> None:
        self._ensure_not_blocked(
            key=_reauth_block_key(user_id=user_id, ip_address=ip_address),
            code="reauth_locked",
            message="Слишком много неудачных подтверждений личности. Попробуйте позже.",
        )

    def record_reauth_failure(self, *, user_id: str, ip_address: str | None) -> None:
        self._record_failure(
            fail_key=_reauth_fail_key(user_id=user_id, ip_address=ip_address),
            block_key=_reauth_block_key(user_id=user_id, ip_address=ip_address),
            threshold=self.settings.auth_reauth_lockout_threshold,
            block_seconds=self.settings.auth_reauth_lockout_seconds,
        )

    def clear_reauth_failures(self, *, user_id: str, ip_address: str | None) -> None:
        self._clear_keys(
            _reauth_fail_key(user_id=user_id, ip_address=ip_address),
            _reauth_block_key(user_id=user_id, ip_address=ip_address),
        )

    def _ensure_not_blocked(self, *, key: str, code: str, message: str) -> None:
        try:
            if redis_limits.key_exists(key=key):
                raise AppError(code, message, 429)
        except RedisError:
            return

    def _record_failure(self, *, fail_key: str, block_key: str, threshold: int, block_seconds: int) -> None:
        try:
            attempts, _ = redis_limits.increment_window_counter(key=fail_key, ttl_seconds=block_seconds)
            if attempts >= threshold:
                redis_limits.set_flag(key=block_key, ttl_seconds=block_seconds)
        except RedisError:
            return

    def _clear_keys(self, *keys: str) -> None:
        try:
            redis_limits.delete_keys(*keys)
        except RedisError:
            return


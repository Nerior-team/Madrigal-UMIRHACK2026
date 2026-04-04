"""Security primitives scaffold."""
import hashlib
import hmac
import secrets
from datetime import timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings

_PASSWORD_HASHER = PasswordHasher()


def hash_password(password: str) -> str:
    return _PASSWORD_HASHER.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _PASSWORD_HASHER.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_token(raw_value: str, *, purpose: str) -> str:
    settings = get_settings()
    payload = f"{purpose}:{raw_value}".encode("utf-8")
    secret = settings.backend_secret_key.encode("utf-8")
    return hmac.new(secret, payload, hashlib.sha256).hexdigest()


def hash_api_key_secret(secret: str) -> str:
    settings = get_settings()
    return hmac.new(settings.api_key_pepper.encode("utf-8"), secret.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_api_key_secret(secret: str, secret_hash: str) -> bool:
    calculated = hash_api_key_secret(secret)
    return hmac.compare_digest(calculated, secret_hash)


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def generate_api_key_secret() -> str:
    return secrets.token_urlsafe(32)


def generate_numeric_code(length: int = 6) -> str:
    alphabet = "0123456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def access_token_ttl() -> timedelta:
    return timedelta(minutes=get_settings().auth_access_token_ttl_minutes)


def refresh_token_ttl() -> timedelta:
    return timedelta(days=get_settings().auth_refresh_token_ttl_days)


def email_code_ttl() -> timedelta:
    return timedelta(minutes=get_settings().auth_email_code_ttl_minutes)


def password_reset_ttl() -> timedelta:
    return timedelta(minutes=get_settings().auth_password_reset_ttl_minutes)


def auth_challenge_ttl() -> timedelta:
    return timedelta(minutes=get_settings().auth_challenge_ttl_minutes)


def reauth_ttl() -> timedelta:
    return timedelta(minutes=get_settings().auth_reauth_ttl_minutes)


def encrypt_value(value: str) -> str:
    key = get_settings().data_encryption_key.encode("utf-8")
    return Fernet(key).encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(value: str) -> str:
    key = get_settings().data_encryption_key.encode("utf-8")
    try:
        return Fernet(key).decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Unable to decrypt value") from exc

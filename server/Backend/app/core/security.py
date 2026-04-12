"""Security primitives scaffold."""
import hashlib
import hmac
import re
import secrets
from datetime import timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings
from app.core.exceptions import AppError

_PASSWORD_HASHER = PasswordHasher()


def hash_password(password: str) -> str:
    return _PASSWORD_HASHER.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _PASSWORD_HASHER.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def validate_password_policy(password: str) -> None:
    if len(password) < 12:
        raise AppError("password_policy_length", "Пароль должен содержать минимум 12 символов.", 400)
    if len(password) > 128:
        raise AppError("password_policy_length", "Пароль не должен быть длиннее 128 символов.", 400)
    if any(char.isspace() for char in password):
        raise AppError("password_policy_whitespace", "Пароль не должен содержать пробелы.", 400)
    checks = (
        (re.search(r"[a-z]", password), "password_policy_lower", "Добавь строчные латинские буквы."),
        (re.search(r"[A-Z]", password), "password_policy_upper", "Добавь заглавные латинские буквы."),
        (re.search(r"\d", password), "password_policy_digit", "Добавь хотя бы одну цифру."),
        (
            re.search(r"[^A-Za-z0-9]", password),
            "password_policy_symbol",
            "Добавь хотя бы один специальный символ.",
        ),
    )
    for matched, code, message in checks:
        if not matched:
            raise AppError(code, message, 400)


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


def generate_signed_csrf_token() -> str:
    raw_value = generate_session_token()
    signature = hash_token(raw_value, purpose="csrf")
    return f"{raw_value}.{signature}"


def verify_signed_csrf_token(token: str) -> bool:
    try:
        raw_value, signature = token.rsplit(".", 1)
    except ValueError:
        return False
    expected_signature = hash_token(raw_value, purpose="csrf")
    return hmac.compare_digest(signature, expected_signature)


def generate_numeric_code(length: int = 6) -> str:
    alphabet = "0123456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def access_token_ttl() -> timedelta:
    return timedelta(minutes=get_settings().auth_access_token_ttl_minutes)


def web_session_ttl() -> timedelta:
    return timedelta(days=get_settings().auth_web_session_ttl_days)


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

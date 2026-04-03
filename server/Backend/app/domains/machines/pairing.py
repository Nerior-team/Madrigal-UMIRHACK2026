from app.core.config import get_settings
from app.core.security import decrypt_value, encrypt_value, generate_numeric_code, generate_session_token


def issue_device_code() -> str:
    return generate_numeric_code(6)


def issue_registration_token() -> str:
    return generate_session_token()


def issue_machine_token() -> str:
    return generate_session_token()


def encrypt_pending_machine_token(raw_token: str) -> str:
    return encrypt_value(raw_token)


def decrypt_pending_machine_token(value: str) -> str:
    return decrypt_value(value)


def registration_ttl_minutes() -> int:
    return get_settings().machine_registration_ttl_minutes

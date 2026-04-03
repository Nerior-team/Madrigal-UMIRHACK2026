import pyotp

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import decrypt_value, encrypt_value, verify_password
from app.domains.auth.schemas import TOTPSetupStartResponse


def build_provisioning_uri(*, email: str, secret: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name=get_settings().brand_display_name)


def start_totp_setup(*, repository, user, password: str) -> TOTPSetupStartResponse:
    if not verify_password(password, user.password_hash):
        raise AppError("invalid_credentials", "Неверный пароль.", 401)

    settings = repository.get_or_create_two_factor_settings(user.id)
    secret = pyotp.random_base32()
    settings.totp_secret_encrypted = encrypt_value(secret)
    repository.save(settings)
    return TOTPSetupStartResponse(
        secret=secret,
        provisioning_uri=build_provisioning_uri(email=user.email, secret=secret),
        issuer=get_settings().brand_display_name,
    )


def verify_totp_code(*, repository, user_id: str, code: str) -> bool:
    settings = repository.get_or_create_two_factor_settings(user_id)
    if not settings.totp_secret_encrypted:
        return False
    secret = decrypt_value(settings.totp_secret_encrypted)
    return pyotp.TOTP(secret).verify(code, valid_window=1)


def confirm_totp_setup(*, repository, user, code: str) -> None:
    settings = repository.get_or_create_two_factor_settings(user.id)
    if not settings.totp_secret_encrypted:
        raise AppError("totp_not_started", "Сначала запустите настройку TOTP.", 400)
    if not verify_totp_code(repository=repository, user_id=user.id, code=code):
        raise AppError("totp_invalid", "Неверный TOTP-код.", 400)
    settings.totp_enabled = True
    repository.save(settings)


def disable_totp(*, repository, user, password: str, code: str) -> None:
    if not verify_password(password, user.password_hash):
        raise AppError("invalid_credentials", "Неверный пароль.", 401)
    settings = repository.get_or_create_two_factor_settings(user.id)
    if not settings.totp_enabled:
        raise AppError("totp_disabled", "TOTP уже выключен.", 400)
    if not verify_totp_code(repository=repository, user_id=user.id, code=code):
        raise AppError("totp_invalid", "Неверный TOTP-код.", 400)
    settings.totp_enabled = False
    settings.totp_secret_encrypted = None
    repository.save(settings)

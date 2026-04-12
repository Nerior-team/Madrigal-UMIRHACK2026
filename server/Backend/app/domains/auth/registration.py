from app.core.exceptions import AppError
from app.core.security import hash_password, hash_token, normalize_email, validate_password_policy
from app.domains.auth.email_verification import issue_email_verification
from app.domains.auth.sessions import issue_session
from app.shared.time import utc_now


def register_user(*, repository, payload, mailer, max_attempts: int):
    normalized_email = normalize_email(payload.email)
    existing = repository.get_user_by_email(normalized_email)
    if existing is not None:
        raise AppError("email_taken", "Пользователь с таким email уже существует.", 409)

    validate_password_policy(payload.password)
    user = repository.create_user(email=normalized_email, password_hash=hash_password(payload.password))
    issue_email_verification(repository=repository, mailer=mailer, user=user, max_attempts=max_attempts)
    return user


def verify_user_email(*, repository, payload, ip_address: str | None, user_agent: str | None):
    user = repository.get_user_by_email(normalize_email(payload.email))
    if user is None:
        raise AppError("user_not_found", "Пользователь не найден.", 404)

    verification = repository.get_latest_email_verification(user.id)
    if verification is None:
        raise AppError("verification_missing", "Код подтверждения не найден.", 404)
    if verification.consumed_at is not None or verification.expires_at < utc_now():
        raise AppError("verification_expired", "Код подтверждения истёк.", 400)
    if verification.attempts >= verification.max_attempts:
        raise AppError("verification_locked", "Превышено количество попыток.", 429)

    verification.attempts += 1
    repository.save(verification)
    if verification.code_hash != hash_token(payload.code, purpose="email_verification"):
        repository.commit()
        raise AppError("verification_invalid", "Неверный код подтверждения.", 400)

    verification.consumed_at = utc_now()
    user.email_verified = True
    user.is_active = True
    repository.save(verification)
    repository.save(user)

    issued = issue_session(
        repository=repository,
        user=user,
        session_kind=payload.client_kind,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return issued.response, issued

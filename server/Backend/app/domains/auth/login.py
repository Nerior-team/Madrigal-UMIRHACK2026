from app.core.exceptions import AppError
from app.core.security import auth_challenge_ttl, normalize_email
from app.domains.auth.schemas import AuthSessionResponse, LoginRequest, LoginTelegramRequest, LoginTwoFactorRequest, UserRead
from app.domains.auth.sessions import enabled_two_factor_methods, issue_session
from app.shared.enums import AuthChallengeKind, TwoFactorMethod
from app.shared.time import utc_now


def login_user(*, repository, payload: LoginRequest, ip_address: str | None, user_agent: str | None, verify_password):
    user = repository.get_user_by_email(normalize_email(payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise AppError("invalid_credentials", "Неверный email или пароль.", 401)
    if not user.email_verified:
        raise AppError("email_not_verified", "Сначала подтвердите email.", 403)
    if not user.is_active:
        raise AppError("user_inactive", "Аккаунт ещё не активирован.", 403)

    two_factor = repository.get_or_create_two_factor_settings(user.id)
    methods = enabled_two_factor_methods(two_factor)
    if methods:
        challenge = repository.create_auth_challenge(
            user_id=user.id,
            challenge_kind=AuthChallengeKind.LOGIN_TOTP if methods[0] == TwoFactorMethod.TOTP else AuthChallengeKind.LOGIN_TELEGRAM,
            method=methods[0],
            payload_hash=None,
            expires_at=utc_now() + auth_challenge_ttl(),
        )
        return AuthSessionResponse(
            user=UserRead.model_validate(user),
            session_kind=payload.client_kind,
            requires_two_factor=True,
            challenge_id=challenge.id,
            available_two_factor_methods=methods,
        ), None

    issued = issue_session(
        repository=repository,
        user=user,
        session_kind=payload.client_kind,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    user.last_login_at = utc_now()
    repository.save(user)
    return issued.response, issued


def complete_totp_login(
    *,
    repository,
    payload: LoginTwoFactorRequest,
    ip_address: str | None,
    user_agent: str | None,
    verify_totp_code,
):
    challenge = repository.get_auth_challenge(payload.challenge_id)
    if challenge is None or challenge.consumed_at is not None or challenge.expires_at < utc_now():
        raise AppError("challenge_invalid", "Срок действия подтверждения входа истёк.", 401)
    if challenge.method != TwoFactorMethod.TOTP:
        raise AppError("challenge_method_invalid", "Этот challenge не относится к TOTP.", 400)

    user = repository.get_user_by_id(challenge.user_id)
    if user is None:
        raise AppError("user_not_found", "Пользователь не найден.", 404)

    if not verify_totp_code(repository=repository, user_id=user.id, code=payload.code):
        raise AppError("totp_invalid", "Неверный TOTP-код.", 401)

    issued = issue_session(
        repository=repository,
        user=user,
        session_kind=payload.client_kind,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    challenge.consumed_at = utc_now()
    user.last_login_at = utc_now()
    repository.save(challenge)
    repository.save(user)
    return issued.response, issued


def complete_telegram_login(
    *,
    repository,
    telegram_repository,
    payload: LoginTelegramRequest,
    ip_address: str | None,
    user_agent: str | None,
):
    challenge = repository.get_auth_challenge(payload.challenge_id)
    if challenge is None or challenge.consumed_at is not None or challenge.expires_at < utc_now():
        raise AppError("challenge_invalid", "Срок действия подтверждения входа истёк.", 401)
    if challenge.method != TwoFactorMethod.TELEGRAM:
        raise AppError("challenge_method_invalid", "Этот challenge не относится к Telegram.", 400)

    user = repository.get_user_by_id(challenge.user_id)
    if user is None:
        raise AppError("user_not_found", "Пользователь не найден.", 404)

    decision = telegram_repository.get_auth_decision(challenge_id=challenge.id)
    if decision is None or (decision.approved_at is None and decision.rejected_at is None):
        raise AppError("challenge_pending", "Подтверждение входа ожидает решения в Telegram.", 409)
    if decision.rejected_at is not None:
        raise AppError("challenge_rejected", "Вход был отклонён в Telegram.", 401)

    issued = issue_session(
        repository=repository,
        user=user,
        session_kind=payload.client_kind,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    challenge.consumed_at = utc_now()
    user.last_login_at = utc_now()
    repository.save(challenge)
    repository.save(user)
    return issued.response, issued

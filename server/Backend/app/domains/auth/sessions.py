from dataclasses import dataclass

from app.core.security import (
    access_token_ttl,
    generate_session_token,
    hash_token,
    refresh_token_ttl,
    web_session_ttl,
)
from app.domains.auth.repository import AuthRepository
from app.domains.auth.schemas import AuthSessionResponse, SessionTokens, UserRead
from app.domains.users.models import User
from app.shared.enums import SessionKind, TwoFactorMethod
from app.shared.time import utc_now


@dataclass(slots=True)
class IssuedSession:
    response: AuthSessionResponse
    access_token: str
    refresh_token: str | None


def enabled_two_factor_methods(settings) -> list[TwoFactorMethod]:
    methods: list[TwoFactorMethod] = []
    if settings.totp_enabled:
        methods.append(TwoFactorMethod.TOTP)
    if settings.telegram_enabled:
        methods.append(TwoFactorMethod.TELEGRAM)
    return methods


def issue_session(
    *,
    repository: AuthRepository,
    user: User,
    session_kind: SessionKind,
    ip_address: str | None,
    user_agent: str | None,
) -> IssuedSession:
    now = utc_now()
    access_token = generate_session_token()
    refresh_token = None if session_kind == SessionKind.WEB else generate_session_token()
    access_expires_at = now + (
        web_session_ttl() if session_kind == SessionKind.WEB else access_token_ttl()
    )
    refresh_expires_at = None if refresh_token is None else now + refresh_token_ttl()

    repository.create_session(
        user_id=user.id,
        session_kind=session_kind,
        access_token_hash=hash_token(access_token, purpose="access"),
        refresh_token_hash=None if refresh_token is None else hash_token(refresh_token, purpose="refresh"),
        access_expires_at=access_expires_at,
        refresh_expires_at=refresh_expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    token_payload = None
    if session_kind != SessionKind.WEB:
        token_payload = SessionTokens(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=access_expires_at,
            refresh_expires_at=refresh_expires_at,
        )

    response = AuthSessionResponse(
        user=UserRead.model_validate(user),
        session_kind=session_kind,
        tokens=token_payload,
    )
    return IssuedSession(response=response, access_token=access_token, refresh_token=refresh_token)

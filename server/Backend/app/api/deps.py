from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import hash_token
from app.db.session import get_db_session
from app.domains.auth.repository import AuthRepository
from app.shared.time import utc_now


def get_repository(db: Annotated[Session, Depends(get_db_session)]) -> AuthRepository:
    return AuthRepository(db)


def build_client_context(request: Request):
    from app.domains.auth.service import ClientContext

    return ClientContext(
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


def get_current_access_token(
    request: Request,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> str:
    session_cookie = request.cookies.get(get_settings().backend_cookie_name)
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip()
    if session_cookie:
        return session_cookie
    raise AppError("unauthorized", "Требуется авторизация.", 401)


def get_current_session(
    repository: Annotated[AuthRepository, Depends(get_repository)],
    access_token: Annotated[str, Depends(get_current_access_token)],
):
    session = repository.get_session_by_access_hash(hash_token(access_token, purpose="access"))
    if session is None or session.revoked_at is not None or session.access_expires_at < utc_now():
        raise AppError("unauthorized", "Сессия недействительна.", 401)
    return session


def get_current_user(
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_session=Depends(get_current_session),
):
    user = repository.get_user_by_id(current_session.user_id)
    if user is None:
        raise AppError("unauthorized", "Пользователь не найден.", 401)
    return user

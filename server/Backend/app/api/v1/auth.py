from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.api.deps import (
    build_client_context,
    get_current_access_token,
    get_current_session,
    get_current_user,
    get_repository,
)
from app.core.config import get_settings
from app.core.security import generate_signed_csrf_token, web_session_ttl
from app.domains.auth.web_apps import resolve_web_app_config
from app.domains.auth.repository import AuthRepository
from app.domains.auth.schemas import (
    AuthSessionResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginTelegramRequest,
    LoginRequest,
    LoginTwoFactorRequest,
    MessageResponse,
    MeResponse,
    ReauthRequest,
    ReauthResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SessionRead,
    SessionRevokeResponse,
    TOTPDisableRequest,
    TOTPSetupConfirmRequest,
    TOTPSetupStartRequest,
    TOTPSetupStartResponse,
    TelegramSetupStartResponse,
    TelegramTwoFactorConfirmRequest,
    TelegramTwoFactorDisableRequest,
    VerifyEmailRequest,
)
from app.domains.auth.service import AuthService
from app.shared.enums import SessionKind

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_web_cookie(request: Request, response: Response, access_token: str) -> None:
    settings = get_settings()
    web_app = resolve_web_app_config(request)
    response.set_cookie(
        key=web_app.cookie_name,
        value=access_token,
        httponly=True,
        secure=settings.backend_cookie_secure,
        samesite="strict",
        path="/",
        domain=settings.backend_cookie_domain,
        max_age=int(web_session_ttl().total_seconds()),
    )


def _set_csrf_cookie(request: Request, response: Response) -> None:
    settings = get_settings()
    web_app = resolve_web_app_config(request)
    response.set_cookie(
        key=web_app.csrf_cookie_name,
        value=generate_signed_csrf_token(),
        httponly=False,
        secure=settings.backend_cookie_secure,
        samesite="strict",
        path="/",
        domain=settings.backend_cookie_domain,
        max_age=int(web_session_ttl().total_seconds()),
    )


def _clear_web_cookie(request: Request, response: Response) -> None:
    settings = get_settings()
    web_app = resolve_web_app_config(request)
    response.delete_cookie(
        key=web_app.cookie_name,
        path="/",
        domain=settings.backend_cookie_domain,
    )
    response.delete_cookie(
        key=web_app.csrf_cookie_name,
        path="/",
        domain=settings.backend_cookie_domain,
    )


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    return AuthService(repository).register(payload, client)


@router.post("/register/verify", response_model=AuthSessionResponse)
def verify_email(
    payload: VerifyEmailRequest,
    request: Request,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).verify_email(payload, client)
    if payload.client_kind == SessionKind.WEB and access_token:
        _set_web_cookie(request, response, access_token)
        _set_csrf_cookie(request, response)
    return auth_response


@router.post("/login", response_model=AuthSessionResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).login(payload, client)
    if payload.client_kind == SessionKind.WEB and access_token:
        _set_web_cookie(request, response, access_token)
        _set_csrf_cookie(request, response)
    return auth_response


@router.post("/login/2fa/totp", response_model=AuthSessionResponse)
def login_totp(
    payload: LoginTwoFactorRequest,
    request: Request,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).login_totp(payload, client)
    if payload.client_kind == SessionKind.WEB and access_token:
        _set_web_cookie(request, response, access_token)
        _set_csrf_cookie(request, response)
    return auth_response


@router.post("/login/2fa/telegram", response_model=AuthSessionResponse)
def login_telegram(
    payload: LoginTelegramRequest,
    request: Request,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).login_telegram(payload, client)
    if payload.client_kind == SessionKind.WEB and access_token:
        _set_web_cookie(request, response, access_token)
        _set_csrf_cookie(request, response)
    return auth_response


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    access_token: Annotated[str, Depends(get_current_access_token)],
    client=Depends(build_client_context),
):
    result = AuthService(repository).logout(access_token, client)
    _clear_web_cookie(request, response)
    return result


@router.get("/me", response_model=MeResponse)
def me(
    request: Request,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    current_session=Depends(get_current_session),
):
    if (
        current_session.session_kind == SessionKind.WEB
        and request.cookies.get(resolve_web_app_config(request).csrf_cookie_name) is None
    ):
        _set_csrf_cookie(request, response)
    return AuthService(repository).me(user=current_user, session=current_session)


@router.post("/password/forgot", response_model=MessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    return AuthService(repository).forgot_password(payload, client)


@router.post("/refresh", response_model=AuthSessionResponse)
def refresh(
    payload: RefreshRequest,
    request: Request,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).refresh(payload, client)
    if auth_response.session_kind == SessionKind.WEB and access_token:
        _set_web_cookie(request, response, access_token)
        _set_csrf_cookie(request, response)
    return auth_response


@router.post("/password/reset", response_model=MessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    return AuthService(repository).reset_password(payload, client)


@router.post("/password/change", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).change_password(user=current_user, payload=payload, client=client)


@router.post("/2fa/totp/setup/start", response_model=TOTPSetupStartResponse)
def start_totp_setup(
    payload: TOTPSetupStartRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).start_totp_setup(user=current_user, payload=payload, client=client)


@router.post("/2fa/totp/setup/confirm", response_model=MessageResponse)
def confirm_totp_setup(
    payload: TOTPSetupConfirmRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).confirm_totp_setup(user=current_user, payload=payload, client=client)


@router.post("/2fa/totp/disable", response_model=MessageResponse)
def disable_totp(
    payload: TOTPDisableRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).disable_totp(user=current_user, payload=payload, client=client)


@router.post("/2fa/telegram/setup/start", response_model=TelegramSetupStartResponse)
def start_telegram_setup(
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).start_telegram_setup(user=current_user, client=client)


@router.post("/2fa/telegram/setup/confirm")
def confirm_telegram_setup(
    payload: TelegramTwoFactorConfirmRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).confirm_telegram_setup(user=current_user, payload=payload, client=client)


@router.post("/2fa/telegram/disable", response_model=MessageResponse)
def disable_telegram(
    payload: TelegramTwoFactorDisableRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).disable_telegram(user=current_user, payload=payload, client=client)


@router.post("/re-auth", response_model=ReauthResponse)
def reauth(
    payload: ReauthRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).reauth(user=current_user, payload=payload, client=client)


@router.get("/sessions", response_model=list[SessionRead])
def list_sessions(
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    current_session=Depends(get_current_session),
):
    return AuthService(repository).list_sessions(user=current_user, current_session=current_session)


@router.delete("/sessions/{session_id}", response_model=SessionRevokeResponse)
def revoke_session(
    session_id: str,
    request: Request,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    current_session=Depends(get_current_session),
    client=Depends(build_client_context),
):
    result = AuthService(repository).revoke_session_by_id(
        user=current_user,
        current_session=current_session,
        session_id=session_id,
        client=client,
    )
    if result.revoked_current_session:
        _clear_web_cookie(request, response)
    return result

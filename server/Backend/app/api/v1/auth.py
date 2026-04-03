from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import (
    build_client_context,
    get_current_access_token,
    get_current_session,
    get_current_user,
    get_repository,
)
from app.core.config import get_settings
from app.core.security import access_token_ttl
from app.domains.auth.repository import AuthRepository
from app.domains.auth.schemas import (
    AuthSessionResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LoginTwoFactorRequest,
    MessageResponse,
    MeResponse,
    ReauthRequest,
    ReauthResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TOTPDisableRequest,
    TOTPSetupConfirmRequest,
    TOTPSetupStartRequest,
    TOTPSetupStartResponse,
    TelegramSetupStartResponse,
    VerifyEmailRequest,
)
from app.domains.auth.service import AuthService
from app.shared.enums import SessionKind

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_web_cookie(response: Response, access_token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.backend_cookie_name,
        value=access_token,
        httponly=True,
        secure=settings.backend_cookie_secure,
        samesite="lax",
        path="/",
        max_age=int(access_token_ttl().total_seconds()),
    )


def _clear_web_cookie(response: Response) -> None:
    response.delete_cookie(key=get_settings().backend_cookie_name, path="/")


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
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).verify_email(payload, client)
    if payload.client_kind == SessionKind.WEB and access_token:
        _set_web_cookie(response, access_token)
    return auth_response


@router.post("/login", response_model=AuthSessionResponse)
def login(
    payload: LoginRequest,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).login(payload, client)
    if payload.client_kind == SessionKind.WEB and access_token:
        _set_web_cookie(response, access_token)
    return auth_response


@router.post("/login/2fa/totp", response_model=AuthSessionResponse)
def login_totp(
    payload: LoginTwoFactorRequest,
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).login_totp(payload, client)
    if payload.client_kind == SessionKind.WEB and access_token:
        _set_web_cookie(response, access_token)
    return auth_response


@router.post("/login/2fa/telegram", response_model=AuthSessionResponse)
def login_telegram(
    payload: LoginTwoFactorRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    return AuthService(repository).login_telegram(payload, client)


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    access_token: Annotated[str, Depends(get_current_access_token)],
    client=Depends(build_client_context),
):
    result = AuthService(repository).logout(access_token, client)
    _clear_web_cookie(response)
    return result


@router.get("/me", response_model=MeResponse)
def me(
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    current_session=Depends(get_current_session),
):
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
    response: Response,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    auth_response, access_token = AuthService(repository).refresh(payload, client)
    if auth_response.session_kind == SessionKind.WEB and access_token:
        _set_web_cookie(response, access_token)
    return auth_response


@router.post("/password/reset", response_model=MessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    client=Depends(build_client_context),
):
    return AuthService(repository).reset_password(payload, client)


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
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).confirm_telegram_setup(user=current_user, client=client)


@router.post("/2fa/telegram/disable")
def disable_telegram(
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).disable_telegram(user=current_user, client=client)


@router.post("/re-auth", response_model=ReauthResponse)
def reauth(
    payload: ReauthRequest,
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
):
    return AuthService(repository).reauth(user=current_user, payload=payload, client=client)

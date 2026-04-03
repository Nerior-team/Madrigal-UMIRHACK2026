from dataclasses import dataclass

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import generate_session_token, hash_password, hash_token, normalize_email, reauth_ttl, verify_password
from app.domains.auth import login as login_flow
from app.domains.auth import password_reset as password_reset_flow
from app.domains.auth import registration as registration_flow
from app.domains.auth import telegram_2fa as telegram_flow
from app.domains.auth import totp as totp_flow
from app.domains.auth.repository import AuthRepository
from app.domains.auth.schemas import (
    AuthSessionResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LoginTwoFactorRequest,
    MeResponse,
    MessageResponse,
    ReauthRequest,
    ReauthResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TOTPDisableRequest,
    TOTPSetupConfirmRequest,
    TOTPSetupStartRequest,
    TelegramSetupStartResponse,
    UserRead,
    VerifyEmailRequest,
)
from app.domains.auth.sessions import enabled_two_factor_methods
from app.infra.email.client import get_mail_transport
from app.infra.observability.audit import record_audit_event
from app.shared.enums import AuditStatus, AuthChallengeKind, SessionKind, TwoFactorMethod
from app.shared.time import utc_now


@dataclass(slots=True)
class ClientContext:
    ip_address: str | None
    user_agent: str | None


class AuthService:
    def __init__(self, repository: AuthRepository) -> None:
        self.repository = repository
        self.mailer = get_mail_transport()

    def register(self, payload: RegisterRequest, client: ClientContext) -> MessageResponse:
        user = registration_flow.register_user(
            repository=self.repository,
            payload=payload,
            mailer=self.mailer,
            max_attempts=get_settings().auth_code_max_attempts,
        )
        record_audit_event(
            self.repository,
            user_id=user.id,
            action="auth.register",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"email": user.email},
        )
        self.repository.commit()
        return MessageResponse(message="Код подтверждения отправлен на email.")

    def verify_email(self, payload: VerifyEmailRequest, client: ClientContext) -> tuple[AuthSessionResponse, str | None]:
        response, issued = registration_flow.verify_user_email(
            repository=self.repository,
            payload=payload,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        record_audit_event(
            self.repository,
            user_id=response.user.id,
            action="auth.verify_email",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"email": response.user.email},
        )
        self.repository.commit()
        return response, None if issued is None else issued.access_token

    def login(self, payload: LoginRequest, client: ClientContext) -> tuple[AuthSessionResponse, str | None]:
        response, issued = login_flow.login_user(
            repository=self.repository,
            payload=payload,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            verify_password=verify_password,
        )
        record_audit_event(
            self.repository,
            user_id=response.user.id,
            action="auth.login",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"requires_two_factor": response.requires_two_factor},
        )
        self.repository.commit()
        return response, None if issued is None else issued.access_token

    def login_totp(self, payload: LoginTwoFactorRequest, client: ClientContext) -> tuple[AuthSessionResponse, str | None]:
        response, issued = login_flow.complete_totp_login(
            repository=self.repository,
            payload=payload,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            verify_totp_code=totp_flow.verify_totp_code,
        )
        record_audit_event(
            self.repository,
            user_id=response.user.id,
            action="auth.login_totp",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details=None,
        )
        self.repository.commit()
        return response, None if issued is None else issued.access_token

    def login_telegram(self, payload: LoginTwoFactorRequest, client: ClientContext):
        return login_flow.complete_telegram_login(repository=self.repository, payload=payload)

    def logout(self, access_token: str | None, client: ClientContext) -> MessageResponse:
        if not access_token:
            raise AppError("session_missing", "Сессия не найдена.", 401)
        session = self.repository.get_session_by_access_hash(hash_token(access_token, purpose="access"))
        if session is None or session.revoked_at is not None:
            raise AppError("session_missing", "Сессия не найдена.", 401)
        self.repository.revoke_session(session, revoked_at=utc_now())
        record_audit_event(
            self.repository,
            user_id=session.user_id,
            action="auth.logout",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.repository.commit()
        return MessageResponse(message="Сессия завершена.")

    def me(self, *, user, session) -> MeResponse:
        settings = self.repository.get_or_create_two_factor_settings(user.id)
        return MeResponse(
            user=UserRead.model_validate(user),
            session_kind=session.session_kind,
            two_factor_enabled=bool(settings.totp_enabled or settings.telegram_enabled),
            enabled_two_factor_methods=enabled_two_factor_methods(settings),
        )

    def refresh(self, payload: RefreshRequest, client: ClientContext) -> tuple[AuthSessionResponse, str | None]:
        session = self.repository.get_session_by_refresh_hash(hash_token(payload.refresh_token, purpose="refresh"))
        if session is None or session.revoked_at is not None or session.refresh_expires_at is None:
            raise AppError("refresh_invalid", "Сессия обновления недействительна.", 401)
        if session.refresh_expires_at < utc_now():
            raise AppError("refresh_expired", "Срок действия refresh token истёк.", 401)

        user = self.repository.get_user_by_id(session.user_id)
        if user is None:
            raise AppError("user_not_found", "Пользователь не найден.", 404)

        self.repository.revoke_session(session, revoked_at=utc_now())
        from app.domains.auth.sessions import issue_session

        issued = issue_session(
            repository=self.repository,
            user=user,
            session_kind=SessionKind(session.session_kind),
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        record_audit_event(
            self.repository,
            user_id=user.id,
            action="auth.refresh",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.repository.commit()
        return issued.response, issued.access_token

    def forgot_password(self, payload: ForgotPasswordRequest, client: ClientContext) -> MessageResponse:
        user = self.repository.get_user_by_email(normalize_email(payload.email))
        if user is not None:
            password_reset_flow.issue_password_reset(repository=self.repository, mailer=self.mailer, user=user)
            record_audit_event(
                self.repository,
                user_id=user.id,
                action="auth.password_forgot",
                status=AuditStatus.SUCCESS,
                ip_address=client.ip_address,
                user_agent=client.user_agent,
                details={"email": user.email},
            )
            self.repository.commit()
        return MessageResponse(message="Если аккаунт существует, письмо для сброса уже отправлено.")

    def reset_password(self, payload: ResetPasswordRequest, client: ClientContext) -> MessageResponse:
        reset = self.repository.get_password_reset_by_hash(hash_token(payload.token, purpose="password_reset"))
        if reset is None or reset.expires_at < utc_now():
            raise AppError("reset_invalid", "Ссылка для сброса недействительна.", 400)
        user = self.repository.get_user_by_id(reset.user_id)
        if user is None:
            raise AppError("user_not_found", "Пользователь не найден.", 404)
        user.password_hash = hash_password(payload.new_password)
        reset.consumed_at = utc_now()
        self.repository.save(user)
        self.repository.save(reset)
        self.repository.revoke_user_sessions(user_id=user.id, revoked_at=utc_now())
        record_audit_event(
            self.repository,
            user_id=user.id,
            action="auth.password_reset",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.repository.commit()
        return MessageResponse(message="Пароль обновлён.")

    def start_totp_setup(self, *, user, payload: TOTPSetupStartRequest, client: ClientContext):
        response = totp_flow.start_totp_setup(repository=self.repository, user=user, password=payload.password)
        record_audit_event(
            self.repository,
            user_id=user.id,
            action="auth.totp_setup_start",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.repository.commit()
        return response

    def confirm_totp_setup(self, *, user, payload: TOTPSetupConfirmRequest, client: ClientContext) -> MessageResponse:
        totp_flow.confirm_totp_setup(repository=self.repository, user=user, code=payload.code)
        record_audit_event(
            self.repository,
            user_id=user.id,
            action="auth.totp_setup_confirm",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.repository.commit()
        return MessageResponse(message="TOTP включён.")

    def disable_totp(self, *, user, payload: TOTPDisableRequest, client: ClientContext) -> MessageResponse:
        totp_flow.disable_totp(repository=self.repository, user=user, password=payload.password, code=payload.code)
        record_audit_event(
            self.repository,
            user_id=user.id,
            action="auth.totp_disable",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.repository.commit()
        return MessageResponse(message="TOTP выключен.")

    def start_telegram_setup(self, *, user, client: ClientContext) -> TelegramSetupStartResponse:
        response = telegram_flow.start_telegram_setup()
        record_audit_event(
            self.repository,
            user_id=user.id,
            action="auth.telegram_2fa_start",
            status=AuditStatus.FAILURE,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.repository.commit()
        return response

    def confirm_telegram_setup(self, *, user, client: ClientContext) -> None:
        telegram_flow.confirm_telegram_setup()

    def disable_telegram(self, *, user, client: ClientContext) -> None:
        telegram_flow.disable_telegram_setup()

    def reauth(self, *, user, payload: ReauthRequest, client: ClientContext) -> ReauthResponse:
        settings = self.repository.get_or_create_two_factor_settings(user.id)
        verified = False
        method = TwoFactorMethod.PASSWORD if payload.password else TwoFactorMethod.TOTP

        if payload.password:
            verified = verify_password(payload.password, user.password_hash)
        elif payload.totp_code and settings.totp_enabled:
            verified = totp_flow.verify_totp_code(repository=self.repository, user_id=user.id, code=payload.totp_code)

        if not verified:
            raise AppError("reauth_failed", "Не удалось подтвердить личность.", 401)

        raw_token = generate_session_token()
        challenge = self.repository.create_auth_challenge(
            user_id=user.id,
            challenge_kind=AuthChallengeKind.REAUTH,
            method=method,
            payload_hash=hash_token(raw_token, purpose="reauth"),
            expires_at=utc_now() + reauth_ttl(),
        )
        record_audit_event(
            self.repository,
            user_id=user.id,
            action="auth.reauth",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
        )
        self.repository.commit()
        return ReauthResponse(reauth_token=raw_token, expires_at=challenge.expires_at)

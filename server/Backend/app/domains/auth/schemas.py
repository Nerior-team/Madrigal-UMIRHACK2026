from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.shared.enums import SessionKind, TwoFactorMethod


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    client_kind: SessionKind = SessionKind.WEB


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)
    client_kind: SessionKind = SessionKind.WEB


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    client_kind: SessionKind = SessionKind.WEB


class LoginTwoFactorRequest(BaseModel):
    challenge_id: str
    code: str = Field(min_length=4, max_length=32)
    client_kind: SessionKind = SessionKind.WEB


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class RefreshRequest(BaseModel):
    refresh_token: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    is_active: bool
    email_verified: bool


class SessionTokens(BaseModel):
    access_token: str
    refresh_token: str | None = None
    expires_at: datetime
    refresh_expires_at: datetime | None = None


class AuthSessionResponse(BaseModel):
    user: UserRead
    session_kind: SessionKind
    requires_two_factor: bool = False
    challenge_id: str | None = None
    available_two_factor_methods: list[TwoFactorMethod] = Field(default_factory=list)
    tokens: SessionTokens | None = None


class MeResponse(BaseModel):
    user: UserRead
    session_kind: SessionKind
    two_factor_enabled: bool
    enabled_two_factor_methods: list[TwoFactorMethod] = Field(default_factory=list)


class TOTPSetupStartRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class TOTPSetupStartResponse(BaseModel):
    secret: str
    provisioning_uri: str
    issuer: str


class TOTPSetupConfirmRequest(BaseModel):
    code: str = Field(min_length=6, max_length=12)


class TOTPDisableRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)
    code: str = Field(min_length=6, max_length=12)


class TelegramSetupStartResponse(BaseModel):
    supported: bool
    reason: str


class ReauthRequest(BaseModel):
    password: str | None = Field(default=None, min_length=8, max_length=128)
    totp_code: str | None = Field(default=None, min_length=6, max_length=12)


class ReauthResponse(BaseModel):
    reauth_token: str
    expires_at: datetime

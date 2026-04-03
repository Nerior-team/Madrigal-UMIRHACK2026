from enum import StrEnum


class SessionKind(StrEnum):
    WEB = "web"
    DESKTOP = "desktop"
    CLI = "cli"


class AuthChallengeKind(StrEnum):
    LOGIN_TOTP = "login_totp"
    LOGIN_TELEGRAM = "login_telegram"
    REAUTH = "re_auth"


class TwoFactorMethod(StrEnum):
    PASSWORD = "password"
    TOTP = "totp"
    TELEGRAM = "telegram"


class AuditStatus(StrEnum):
    SUCCESS = "success"
    FAILURE = "failure"

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


class OperatingSystemFamily(StrEnum):
    WINDOWS = "windows"
    LINUX = "linux"
    MACOS = "macos"
    UNKNOWN = "unknown"


class MachineStatus(StrEnum):
    PENDING = "pending"
    ONLINE = "online"
    OFFLINE = "offline"


class MachineAccessRole(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class MachineInviteStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REVOKED = "revoked"
    INVALIDATED = "invalidated"
    EXPIRED = "expired"

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


class CommandRunner(StrEnum):
    SHELL = "shell"
    POWERSHELL = "powershell"


class CommandParameterType(StrEnum):
    ENUM = "enum"


class TaskStatus(StrEnum):
    QUEUED = "queued"
    DISPATCHED = "dispatched"
    ACCEPTED = "accepted"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskKind(StrEnum):
    SYSTEM_TEMPLATE = "system_template"
    CUSTOM_TEMPLATE = "custom_template"


class TaskFailureKind(StrEnum):
    TRANSIENT = "transient"
    PERMANENT = "permanent"
    CANCELLED = "cancelled"


class TaskLogStream(StrEnum):
    STDOUT = "stdout"
    STDERR = "stderr"
    SYSTEM = "system"


class ResultParserKind(StrEnum):
    NONE = "none"
    BASIC_DIAGNOSTICS = "basic_diagnostics"
    DISK_USAGE = "disk_usage"
    NETWORK_CONTEXT = "network_context"
    MEMORY_USAGE = "memory_usage"


class ApiKeyPermission(StrEnum):
    READ = "read"
    RUN = "run"


class ApiKeyExpiryPreset(StrEnum):
    ONE_TIME = "one_time"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"
    UNLIMITED = "unlimited"

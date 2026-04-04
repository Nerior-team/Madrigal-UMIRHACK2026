from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(slots=True)
class DaemonState:
    backend_base_url: str
    machine_id: str | None
    machine_token: str | None
    agent_version: str
    paired_at: str | None
    os_family: str | None = None
    heartbeat_interval_seconds: int = 60
    connection_status: str = "stopped"
    last_heartbeat_at: str | None = None
    last_control_connect_at: str | None = None
    last_config_sync_at: str | None = None
    config_fingerprint: str | None = None
    allowed_runners: list[str] = field(default_factory=list)
    revoked_reason: str | None = None
    unpaired_at: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)

    @property
    def is_paired(self) -> bool:
        return bool(self.machine_id and self.machine_token)

    def set_connection_status(self, status: str) -> None:
        self.connection_status = status

    def sync_identity(self, identity: "AgentIdentity", *, synced_at: str) -> None:
        self.machine_id = identity.machine_id
        self.os_family = identity.os_family
        self.allowed_runners = list(identity.allowed_runners)
        self.config_fingerprint = identity.config_fingerprint
        self.last_heartbeat_at = identity.last_heartbeat_at
        self.last_config_sync_at = synced_at
        self.connection_status = "online"
        self.revoked_reason = None
        self.unpaired_at = None

    def clear_pairing(self, *, reason: str | None, cleared_at: str, status: str) -> None:
        self.machine_token = None
        self.allowed_runners = []
        self.config_fingerprint = None
        self.last_config_sync_at = None
        self.connection_status = status
        self.revoked_reason = reason
        self.unpaired_at = cleared_at


@dataclass(slots=True)
class RegistrationContext:
    registration_id: str
    device_code: str
    registration_token: str
    expires_at: str


@dataclass(slots=True)
class AgentIdentity:
    machine_id: str
    display_name: str
    hostname: str
    os_family: str
    os_version: str | None
    status: str
    concurrency_limit: int
    last_heartbeat_at: str | None
    allowed_runners: list[str]
    config_fingerprint: str


@dataclass(slots=True)
class ClaimedTask:
    task_id: str
    attempt_id: str
    template_key: str
    template_name: str
    runner: str
    parser_kind: str
    command: str
    params: dict[str, str]

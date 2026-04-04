from dataclasses import asdict, dataclass
from typing import Any


@dataclass(slots=True)
class DaemonState:
    backend_base_url: str
    machine_id: str
    machine_token: str
    agent_version: str
    paired_at: str
    heartbeat_interval_seconds: int = 60

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


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

from datetime import datetime

from pydantic import BaseModel
from app.shared.enums import CommandRunner
from app.shared.enums import MachineStatus, OperatingSystemFamily


class AgentRegistrationStartResponse(BaseModel):
    registration_id: str
    device_code: str
    registration_token: str
    expires_at: datetime


class AgentRegistrationCompleteResponse(BaseModel):
    machine_id: str
    machine_token: str


class AgentHeartbeatAck(BaseModel):
    status: str
    machine_id: str
    last_seen_at: datetime


class AgentIdentityResponse(BaseModel):
    machine_id: str
    display_name: str
    hostname: str
    os_family: OperatingSystemFamily
    os_version: str | None
    status: MachineStatus
    concurrency_limit: int
    last_heartbeat_at: datetime | None
    allowed_runners: list[CommandRunner]
    config_fingerprint: str


class AgentUnpairResponse(BaseModel):
    machine_id: str
    message: str

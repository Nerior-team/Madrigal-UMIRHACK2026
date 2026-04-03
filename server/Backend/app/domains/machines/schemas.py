from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import MachineAccessRole, MachineStatus, OperatingSystemFamily


class MachineRegistrationStartRequest(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=255)
    hostname: str = Field(min_length=1, max_length=255)
    os_family: OperatingSystemFamily
    os_version: str | None = Field(default=None, max_length=255)
    agent_version: str | None = Field(default=None, max_length=64)


class MachineRegistrationStartResponse(BaseModel):
    registration_id: str
    device_code: str
    registration_token: str
    expires_at: datetime


class MachineRegistrationConfirmRequest(BaseModel):
    device_code: str = Field(min_length=6, max_length=12)
    display_name: str | None = Field(default=None, min_length=1, max_length=255)


class MachineHeartbeatRequest(BaseModel):
    agent_version: str | None = Field(default=None, max_length=64)
    status_payload: dict | None = None


class MachineSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    display_name: str
    hostname: str
    os_family: OperatingSystemFamily
    os_version: str | None
    status: MachineStatus
    last_heartbeat_at: datetime | None
    owner_email: str
    my_role: MachineAccessRole


class MachineDetail(MachineSummary):
    creator_user_id: str


class MachineRegistrationConfirmResponse(BaseModel):
    machine: MachineDetail


class MachineRegistrationCompleteRequest(BaseModel):
    registration_token: str


class MachineRegistrationCompleteResponse(BaseModel):
    machine_id: str
    machine_token: str


class MachineHeartbeatResponse(BaseModel):
    status: str
    machine_id: str
    last_seen_at: datetime

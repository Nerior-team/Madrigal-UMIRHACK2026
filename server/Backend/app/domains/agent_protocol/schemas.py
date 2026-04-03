from datetime import datetime

from pydantic import BaseModel


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

from datetime import datetime

from pydantic import BaseModel, Field

from app.domains.machines.schemas import MachineSummary


class GroupCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)


class GroupUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)


class GroupAddMachineRequest(BaseModel):
    machine_id: str


class GroupRead(BaseModel):
    id: str
    owner_user_id: str
    name: str
    description: str | None
    machine_count: int
    created_at: datetime
    updated_at: datetime


class GroupMemberRead(BaseModel):
    machine_id: str
    added_by_user_id: str | None
    created_at: datetime
    machine: MachineSummary


class GroupDetailRead(BaseModel):
    id: str
    owner_user_id: str
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    machines: list[GroupMemberRead]


class GroupActionResponse(BaseModel):
    message: str


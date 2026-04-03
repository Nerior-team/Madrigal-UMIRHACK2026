from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.shared.enums import MachineAccessRole, MachineInviteStatus


class MachineAccessEntryRead(BaseModel):
    id: str
    user_id: str
    email: EmailStr
    role: MachineAccessRole
    granted_by_user_id: str | None
    created_at: datetime
    revoked_at: datetime | None
    is_creator_owner: bool


class MachineInviteCreateRequest(BaseModel):
    email: EmailStr
    role: MachineAccessRole


class MachineInviteRead(BaseModel):
    id: str
    email: EmailStr
    role: MachineAccessRole
    status: MachineInviteStatus
    expires_at: datetime
    invited_by_user_id: str


class MachineInvitePreview(BaseModel):
    machine_id: str
    machine_display_name: str
    email: EmailStr
    role: MachineAccessRole
    status: MachineInviteStatus
    expires_at: datetime


class MachineInviteAcceptResponse(BaseModel):
    machine_id: str
    role: MachineAccessRole


class MachineRoleUpdateRequest(BaseModel):
    role: MachineAccessRole


class MessageResponse(BaseModel):
    message: str

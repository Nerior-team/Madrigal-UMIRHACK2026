from dataclasses import dataclass
from datetime import datetime

from pydantic import BaseModel, Field

from app.domains.commands.schemas import MachineCommandTemplateRead
from app.domains.machines.schemas import MachineDetail, MachineSummary
from app.domains.reports.schemas import ReportExportRead, ResultSummaryRead
from app.domains.results.schemas import CommandExecutionResultRead
from app.domains.tasks.schemas import TaskCreateRequest, TaskLogEntryRead, TaskRead
from app.shared.enums import ApiKeyExpiryPreset, ApiKeyPermission


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    permission: ApiKeyPermission
    machine_ids: list[str] = Field(min_length=1)
    allowed_template_keys: list[str] = Field(default_factory=list)
    expiry_preset: ApiKeyExpiryPreset = ApiKeyExpiryPreset.MONTH
    reauth_token: str = Field(min_length=16, max_length=512)


class ApiKeyDeleteRequest(BaseModel):
    reauth_token: str = Field(min_length=16, max_length=512)


class ApiKeyRead(BaseModel):
    id: str
    public_id: str
    name: str
    permission: ApiKeyPermission
    machine_ids: list[str]
    allowed_template_keys: list[str]
    usage_limit: int | None
    uses_count: int
    expires_at: datetime | None
    last_used_at: datetime | None
    last_used_ip: str | None
    created_at: datetime
    revoked_at: datetime | None
    is_active: bool


class ApiKeyCreateResponse(BaseModel):
    key: ApiKeyRead
    raw_key: str


class ExternalMachineListResponse(BaseModel):
    machines: list[MachineSummary]


class ExternalTaskCreateRequest(TaskCreateRequest):
    pass


class ExternalTaskReadResponse(BaseModel):
    task: TaskRead


class ExternalTaskLogsResponse(BaseModel):
    logs: list[TaskLogEntryRead]


class ExternalResultReadResponse(BaseModel):
    result: CommandExecutionResultRead


class ExternalResultSummaryResponse(BaseModel):
    summary: ResultSummaryRead


class ExternalResultExportResponse(BaseModel):
    export: ReportExportRead


class ExternalMachineCommandsResponse(BaseModel):
    commands: list[MachineCommandTemplateRead]


@dataclass(slots=True)
class ExternalApiPrincipal:
    user: object
    key: object
    machine_ids: set[str]
    template_keys: set[str]
    permission: ApiKeyPermission

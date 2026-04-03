from datetime import datetime

from pydantic import BaseModel, Field

from app.shared.enums import CommandRunner, ResultParserKind, TaskFailureKind, TaskLogStream, TaskStatus


class TaskCreateRequest(BaseModel):
    machine_id: str
    template_key: str
    params: dict[str, str] = Field(default_factory=dict)


class TaskProgressRequest(BaseModel):
    message: str | None = Field(default=None, max_length=2000)
    percent: int | None = Field(default=None, ge=0, le=100)


class TaskLogRequest(BaseModel):
    stream: TaskLogStream
    chunk: str
    sequence: int = Field(ge=1)


class TaskResultRequest(BaseModel):
    stdout: str = ""
    stderr: str = ""
    exit_code: int
    duration_ms: int = Field(ge=0)


class TaskFailureRequest(BaseModel):
    error_kind: TaskFailureKind
    error_message: str = Field(min_length=1, max_length=4000)
    stdout: str = ""
    stderr: str = ""
    duration_ms: int = Field(ge=0, default=0)


class TaskAttemptRead(BaseModel):
    id: str
    attempt_no: int
    status: TaskStatus
    failure_kind: TaskFailureKind | None
    error_message: str | None
    progress_message: str | None
    progress_percent: int | None
    queued_at: datetime
    dispatched_at: datetime | None
    accepted_at: datetime | None
    started_at: datetime | None
    finished_at: datetime | None
    cancel_requested_at: datetime | None
    result_id: str | None = None


class TaskLogEntryRead(BaseModel):
    id: str
    attempt_id: str
    stream: TaskLogStream
    sequence: int
    chunk: str
    created_at: datetime


class TaskRead(BaseModel):
    id: str
    machine_id: str
    template_key: str
    template_name: str
    runner: CommandRunner
    status: TaskStatus
    requested_by_user_id: str
    params: dict[str, str]
    rendered_command: str
    parser_kind: ResultParserKind
    created_at: datetime
    updated_at: datetime
    attempts: list[TaskAttemptRead]


class AgentClaimTaskResponse(BaseModel):
    task_id: str
    attempt_id: str
    template_key: str
    template_name: str
    runner: CommandRunner
    parser_kind: ResultParserKind
    command: str
    params: dict[str, str]


class TaskActionResponse(BaseModel):
    message: str

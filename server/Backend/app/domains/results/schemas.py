from datetime import datetime

from pydantic import BaseModel

from app.shared.enums import ResultParserKind


class ShellResultRead(BaseModel):
    command: str
    stdout: str
    stderr: str
    exit_code: int
    duration_ms: int


class CommandExecutionResultRead(BaseModel):
    id: str
    task_id: str
    attempt_id: str
    parser_kind: ResultParserKind
    summary: str | None
    parsed_payload: dict | None
    shell: ShellResultRead
    created_at: datetime


class ResultHistoryEntryRead(BaseModel):
    id: str
    task_id: str
    attempt_id: str
    machine_id: str
    template_key: str
    template_name: str
    parser_kind: ResultParserKind
    summary: str | None
    exit_code: int
    duration_ms: int
    created_at: datetime


class ResultDiffChangeRead(BaseModel):
    path: str
    left_value: str | int | float | bool | None
    right_value: str | int | float | bool | None


class ResultDiffRead(BaseModel):
    left_result_id: str
    right_result_id: str
    has_changes: bool
    changes: list[ResultDiffChangeRead]

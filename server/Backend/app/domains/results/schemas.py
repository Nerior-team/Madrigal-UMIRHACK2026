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

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ResultSummaryRead(BaseModel):
    result_id: str
    task_id: str
    machine_id: str
    status: str
    summary: str
    duration_ms: int
    exit_code: int
    parser_kind: str
    highlights: list[str]
    created_at: datetime


class TaskSummaryRead(BaseModel):
    task_id: str
    machine_id: str
    template_key: str
    template_name: str
    status: str
    summary: str
    latest_attempt_no: int
    has_result: bool
    has_logs: bool
    updated_at: datetime


class ReportExportRead(BaseModel):
    format: str
    generated_at: datetime
    payload: dict[str, Any]

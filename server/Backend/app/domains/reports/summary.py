from app.domains.reports.schemas import ResultSummaryRead, TaskSummaryRead
from app.domains.results.repository import ResultHistoryRow
from app.domains.tasks.repository import TaskReportRow


def _compact_lines(value: str, *, limit: int = 3) -> list[str]:
    lines = [line.strip() for line in value.splitlines() if line.strip()]
    return lines[:limit]


def _format_highlight(key: str, value) -> str:
    if isinstance(value, list):
        rendered = ", ".join(str(item) for item in value[:3])
    elif isinstance(value, dict):
        rendered = ", ".join(f"{inner_key}={inner_value}" for inner_key, inner_value in list(value.items())[:3])
    else:
        rendered = str(value)
    return f"{key}: {rendered[:180]}"


def _build_highlights(parsed_payload: dict | None, *, stderr: str, stdout: str) -> list[str]:
    highlights: list[str] = []
    if isinstance(parsed_payload, dict):
        for key, value in list(parsed_payload.items())[:3]:
            if key == "raw":
                continue
            highlights.append(_format_highlight(key, value))
    if not highlights and stderr:
        highlights.extend(_compact_lines(stderr))
    if not highlights and stdout:
        highlights.extend(_compact_lines(stdout))
    if not highlights:
        highlights.append("Детали не найдены.")
    return highlights


def build_result_summary(row: ResultHistoryRow) -> ResultSummaryRead:
    result = row.result
    task = row.task
    highlights = _build_highlights(result.parsed_payload, stderr=result.stderr, stdout=result.stdout)
    status = "succeeded" if result.exit_code == 0 else "failed"
    summary_text = result.summary or (
        "Команда завершилась успешно." if result.exit_code == 0 else "Команда завершилась с ошибкой."
    )
    return ResultSummaryRead(
        result_id=result.id,
        task_id=task.id,
        machine_id=task.machine_id,
        status=status,
        summary=summary_text,
        duration_ms=result.duration_ms,
        exit_code=result.exit_code,
        parser_kind=result.parser_kind.value,
        highlights=highlights,
        created_at=result.created_at,
    )


def build_task_summary(row: TaskReportRow) -> TaskSummaryRead:
    task = row.task
    latest_attempt = row.attempts[-1] if row.attempts else None
    summary_text = task.template_name
    if row.result is not None and row.result.summary:
        summary_text = row.result.summary
    elif latest_attempt is not None and latest_attempt.error_message:
        summary_text = latest_attempt.error_message
    elif task.status.value == "queued":
        summary_text = "Задача ожидает выполнения."
    elif task.status.value == "running":
        summary_text = latest_attempt.progress_message or "Задача выполняется."
    elif task.status.value == "succeeded":
        summary_text = "Задача завершилась успешно."
    elif task.status.value == "failed":
        summary_text = "Задача завершилась с ошибкой."
    elif task.status.value == "cancelled":
        summary_text = "Задача была отменена."
    return TaskSummaryRead(
        task_id=task.id,
        machine_id=task.machine_id,
        template_key=task.template_key,
        template_name=task.template_name,
        status=task.status.value,
        summary=summary_text,
        latest_attempt_no=task.latest_attempt_no,
        has_result=row.result is not None,
        has_logs=bool(row.logs),
        updated_at=task.updated_at,
    )

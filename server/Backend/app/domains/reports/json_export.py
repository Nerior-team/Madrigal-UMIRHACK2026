from app.domains.machines.models import Machine
from app.domains.reports.schemas import ReportExportRead
from app.domains.reports.summary import build_result_summary, build_task_summary
from app.domains.results.repository import ResultHistoryRow
from app.domains.tasks.repository import TaskReportRow
from app.shared.time import utc_now


def _iso(value) -> str | None:
    if value is None:
        return None
    return value.isoformat()


def _machine_payload(machine: Machine | None) -> dict:
    if machine is None:
        return {}
    return {
        "machine_id": machine.id,
        "display_name": machine.display_name,
        "hostname": machine.hostname,
        "os_family": machine.os_family.value,
        "os_version": machine.os_version,
        "status": machine.status.value,
        "concurrency_limit": machine.concurrency_limit,
        "last_heartbeat_at": _iso(machine.last_heartbeat_at),
        "created_at": _iso(machine.created_at),
        "updated_at": _iso(machine.updated_at),
    }


def build_result_export(*, row: ResultHistoryRow, machine: Machine | None) -> ReportExportRead:
    result = row.result
    task = row.task
    summary = build_result_summary(row)
    return ReportExportRead(
        format="json",
        generated_at=utc_now(),
        payload={
            "machine": _machine_payload(machine),
            "task": {
                "task_id": task.id,
                "template_key": task.template_key,
                "template_name": task.template_name,
                "status": task.status.value,
                "runner": task.runner.value,
                "rendered_command": task.rendered_command,
                "params": task.params_payload or {},
                "created_at": _iso(task.created_at),
                "updated_at": _iso(task.updated_at),
            },
            "result": {
                "result_id": result.id,
                "attempt_id": result.attempt_id,
                "parser_kind": result.parser_kind.value,
                "summary": result.summary,
                "parsed_payload": result.parsed_payload,
                "summary_view": summary.model_dump(mode="json"),
                "shell": {
                    "command": result.shell_command,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "exit_code": result.exit_code,
                    "duration_ms": result.duration_ms,
                },
                "created_at": _iso(result.created_at),
            },
        },
    )


def build_machine_history_export(*, machine: Machine, rows: list[ResultHistoryRow]) -> ReportExportRead:
    return ReportExportRead(
        format="json",
        generated_at=utc_now(),
        payload={
            "machine": _machine_payload(machine),
            "total_results": len(rows),
            "results": [
                {
                    "result_id": row.result.id,
                    "task_id": row.task.id,
                    "template_key": row.task.template_key,
                    "template_name": row.task.template_name,
                    "status": row.task.status.value,
                    "summary": row.result.summary,
                    "parser_kind": row.result.parser_kind.value,
                    "exit_code": row.result.exit_code,
                    "duration_ms": row.result.duration_ms,
                    "created_at": _iso(row.result.created_at),
                }
                for row in rows
            ],
        },
    )


def build_task_export(*, row: TaskReportRow, machine: Machine | None) -> ReportExportRead:
    task = row.task
    task_summary = build_task_summary(row)
    return ReportExportRead(
        format="json",
        generated_at=utc_now(),
        payload={
            "machine": _machine_payload(machine),
            "task": {
                "task_id": task.id,
                "machine_id": task.machine_id,
                "template_key": task.template_key,
                "template_name": task.template_name,
                "status": task.status.value,
                "runner": task.runner.value,
                "rendered_command": task.rendered_command,
                "params": task.params_payload or {},
                "created_at": _iso(task.created_at),
                "updated_at": _iso(task.updated_at),
                "summary_view": task_summary.model_dump(mode="json"),
            },
            "attempts": [
                {
                    "attempt_id": attempt.id,
                    "attempt_no": attempt.attempt_no,
                    "status": attempt.status.value,
                    "failure_kind": attempt.failure_kind.value if attempt.failure_kind else None,
                    "error_message": attempt.error_message,
                    "progress_message": attempt.progress_message,
                    "progress_percent": attempt.progress_percent,
                    "queued_at": _iso(attempt.queued_at),
                    "dispatched_at": _iso(attempt.dispatched_at),
                    "accepted_at": _iso(attempt.accepted_at),
                    "started_at": _iso(attempt.started_at),
                    "finished_at": _iso(attempt.finished_at),
                }
                for attempt in row.attempts
            ],
            "logs": [
                {
                    "log_id": item.id,
                    "attempt_id": item.attempt_id,
                    "stream": item.stream.value,
                    "sequence": item.sequence,
                    "chunk": item.chunk,
                    "created_at": _iso(item.created_at),
                }
                for item in row.logs
            ],
            "result": (
                {
                    "result_id": row.result.id,
                    "attempt_id": row.result.attempt_id,
                    "parser_kind": row.result.parser_kind.value,
                    "summary": row.result.summary,
                    "parsed_payload": row.result.parsed_payload,
                    "shell": {
                        "command": row.result.shell_command,
                        "stdout": row.result.stdout,
                        "stderr": row.result.stderr,
                        "exit_code": row.result.exit_code,
                        "duration_ms": row.result.duration_ms,
                    },
                    "created_at": _iso(row.result.created_at),
                }
                if row.result is not None
                else None
            ),
        },
    )

def build_result_snapshot(*, result, task) -> dict:
    payload = {
        "result_id": result.id,
        "task_id": result.task_id,
        "machine_id": task.machine_id,
        "template_key": task.template_key,
        "template_name": task.template_name,
        "parser_kind": str(result.parser_kind),
        "summary": result.summary,
        "shell": {
            "command": result.shell_command,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.exit_code,
            "duration_ms": result.duration_ms,
        },
    }
    if result.parsed_payload is not None:
        payload["parsed_payload"] = result.parsed_payload
    return payload

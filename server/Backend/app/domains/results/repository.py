from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.results.models import CommandExecutionResult


class ResultRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def save(self, entity) -> None:
        self.db.add(entity)
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def create_result(
        self,
        *,
        task_id: str,
        attempt_id: str,
        parser_kind,
        summary: str | None,
        parsed_payload: dict | None,
        shell_command: str,
        stdout: str,
        stderr: str,
        exit_code: int,
        duration_ms: int,
    ) -> CommandExecutionResult:
        result = CommandExecutionResult(
            task_id=task_id,
            attempt_id=attempt_id,
            parser_kind=parser_kind,
            summary=summary,
            parsed_payload=parsed_payload,
            shell_command=shell_command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            duration_ms=duration_ms,
        )
        self.db.add(result)
        self.db.flush()
        return result

    def get_result(self, result_id: str) -> CommandExecutionResult | None:
        return self.db.get(CommandExecutionResult, result_id)

    def get_result_by_attempt(self, attempt_id: str) -> CommandExecutionResult | None:
        statement = select(CommandExecutionResult).where(CommandExecutionResult.attempt_id == attempt_id)
        return self.db.scalar(statement)

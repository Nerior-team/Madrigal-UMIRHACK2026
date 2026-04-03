from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.shared.enums import ResultParserKind


class CommandExecutionResult(Base):
    __tablename__ = "command_execution_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    attempt_id: Mapped[str] = mapped_column(
        ForeignKey("task_attempts.id", ondelete="CASCADE"), unique=True, index=True
    )
    parser_kind: Mapped[ResultParserKind] = mapped_column(
        Enum(ResultParserKind), default=ResultParserKind.NONE, nullable=False
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    shell_command: Mapped[str] = mapped_column(Text, nullable=False)
    stdout: Mapped[str] = mapped_column(Text, nullable=False)
    stderr: Mapped[str] = mapped_column(Text, nullable=False)
    exit_code: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

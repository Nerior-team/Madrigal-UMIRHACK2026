from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.shared.enums import CommandRunner, TaskFailureKind, TaskKind, TaskLogStream, TaskStatus


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    machine_id: Mapped[str] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    requested_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    template_key: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    template_name: Mapped[str] = mapped_column(String(255), nullable=False)
    task_kind: Mapped[TaskKind] = mapped_column(Enum(TaskKind), nullable=False)
    runner: Mapped[CommandRunner] = mapped_column(Enum(CommandRunner), nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.QUEUED, nullable=False, index=True)
    params_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    rendered_command: Mapped[str] = mapped_column(Text, nullable=False)
    parser_kind: Mapped[str] = mapped_column(String(64), nullable=False)
    latest_attempt_no: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class TaskAttempt(Base):
    __tablename__ = "task_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    machine_id: Mapped[str] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    attempt_no: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.QUEUED, nullable=False, index=True)
    failure_kind: Mapped[TaskFailureKind | None] = mapped_column(Enum(TaskFailureKind), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    progress_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    progress_percent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    queued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class TaskEvent(Base):
    __tablename__ = "task_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("task_attempts.id", ondelete="CASCADE"), index=True)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TaskLogChunk(Base):
    __tablename__ = "task_log_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("task_attempts.id", ondelete="CASCADE"), index=True)
    stream: Mapped[TaskLogStream] = mapped_column(Enum(TaskLogStream), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

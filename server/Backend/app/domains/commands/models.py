from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.shared.enums import CommandRunner, ResultParserKind


class MachineCommandTemplate(Base):
    __tablename__ = "machine_command_templates"
    __table_args__ = (UniqueConstraint("machine_id", "template_key", name="uq_machine_command_templates_machine_key"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    machine_id: Mapped[str] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    template_key: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    runner: Mapped[CommandRunner] = mapped_column(Enum(CommandRunner), nullable=False)
    command_pattern: Mapped[str] = mapped_column(Text, nullable=False)
    parameters_schema: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    parser_kind: Mapped[ResultParserKind] = mapped_column(
        Enum(ResultParserKind), default=ResultParserKind.NONE, nullable=False
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

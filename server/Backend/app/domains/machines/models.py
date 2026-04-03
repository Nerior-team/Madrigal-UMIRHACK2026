from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.shared.enums import MachineStatus, OperatingSystemFamily


class Machine(Base):
    __tablename__ = "machines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    os_family: Mapped[OperatingSystemFamily] = mapped_column(Enum(OperatingSystemFamily), nullable=False)
    os_version: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[MachineStatus] = mapped_column(
        Enum(MachineStatus), default=MachineStatus.PENDING, nullable=False, index=True
    )
    machine_token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    last_heartbeat_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class MachineRegistration(Base):
    __tablename__ = "machine_registrations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    device_code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    registration_token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    pending_display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pending_hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    pending_os_family: Mapped[OperatingSystemFamily] = mapped_column(Enum(OperatingSystemFamily), nullable=False)
    pending_os_version: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pending_agent_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    pending_machine_token_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    machine_id: Mapped[str | None] = mapped_column(ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    confirmed_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MachineHeartbeat(Base):
    __tablename__ = "machine_heartbeats"

    machine_id: Mapped[str] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), primary_key=True)
    agent_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

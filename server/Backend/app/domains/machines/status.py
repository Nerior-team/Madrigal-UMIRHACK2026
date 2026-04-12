from datetime import datetime, timedelta

from app.shared.enums import MachineStatus


def is_machine_heartbeat_stale(
    *,
    last_heartbeat_at: datetime | None,
    now: datetime,
    stale_minutes: int,
) -> bool:
    if last_heartbeat_at is None:
        return True
    return now - last_heartbeat_at > timedelta(minutes=stale_minutes)


def resolve_machine_status(
    *,
    stored_status: MachineStatus,
    last_heartbeat_at: datetime | None,
    now: datetime,
    stale_minutes: int,
) -> MachineStatus:
    if stored_status == MachineStatus.PENDING:
        return MachineStatus.PENDING

    if stored_status == MachineStatus.OFFLINE:
        return MachineStatus.OFFLINE

    if is_machine_heartbeat_stale(
        last_heartbeat_at=last_heartbeat_at,
        now=now,
        stale_minutes=stale_minutes,
    ):
        return MachineStatus.OFFLINE

    return MachineStatus.ONLINE

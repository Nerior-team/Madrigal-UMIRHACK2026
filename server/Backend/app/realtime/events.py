from dataclasses import dataclass
from uuid import uuid4

from app.shared.time import utc_now

@dataclass(slots=True)
class RealtimeEvent:
    type: str
    payload: dict

    def as_json(self) -> dict:
        return {"type": self.type, "payload": self.payload}


@dataclass(slots=True)
class OperatorRealtimeEvent:
    event_type: str
    machine_id: str | None
    payload: dict
    task_id: str | None = None
    event_id: str = ""
    occurred_at: str = ""

    def __post_init__(self) -> None:
        if not self.event_id:
            self.event_id = str(uuid4())
        if not self.occurred_at:
            self.occurred_at = utc_now().isoformat()

    def as_json(self) -> dict:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "occurred_at": self.occurred_at,
            "machine_id": self.machine_id,
            "task_id": self.task_id,
            "payload": self.payload,
        }


def task_available_event(*, machine_id: str) -> RealtimeEvent:
    return RealtimeEvent(type="task_available", payload={"machine_id": machine_id})


def task_cancel_event(*, machine_id: str, task_id: str, attempt_id: str) -> RealtimeEvent:
    return RealtimeEvent(
        type="task_cancel",
        payload={"machine_id": machine_id, "task_id": task_id, "attempt_id": attempt_id},
    )


def config_updated_event(*, machine_id: str, reason: str) -> RealtimeEvent:
    return RealtimeEvent(
        type="config_updated",
        payload={"machine_id": machine_id, "reason": reason},
    )


def access_revoked_event(*, machine_id: str, reason: str) -> RealtimeEvent:
    return RealtimeEvent(
        type="access_revoked",
        payload={"machine_id": machine_id, "reason": reason},
    )


def operator_event(
    *,
    event_type: str,
    machine_id: str | None,
    payload: dict,
    task_id: str | None = None,
) -> OperatorRealtimeEvent:
    return OperatorRealtimeEvent(
        event_type=event_type,
        machine_id=machine_id,
        task_id=task_id,
        payload=payload,
    )

from dataclasses import dataclass


@dataclass(slots=True)
class RealtimeEvent:
    type: str
    payload: dict

    def as_json(self) -> dict:
        return {"type": self.type, "payload": self.payload}


def task_available_event(*, machine_id: str) -> RealtimeEvent:
    return RealtimeEvent(type="task_available", payload={"machine_id": machine_id})


def task_cancel_event(*, machine_id: str, task_id: str, attempt_id: str) -> RealtimeEvent:
    return RealtimeEvent(
        type="task_cancel",
        payload={"machine_id": machine_id, "task_id": task_id, "attempt_id": attempt_id},
    )

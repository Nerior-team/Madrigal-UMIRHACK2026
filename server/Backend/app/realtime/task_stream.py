from app.realtime.events import task_available_event, task_cancel_event
from app.realtime.machine_stream import machine_stream


async def notify_task_available(*, machine_id: str) -> None:
    await machine_stream.send_json(machine_id=machine_id, message=task_available_event(machine_id=machine_id).as_json())


async def notify_task_cancel(*, machine_id: str, task_id: str, attempt_id: str) -> None:
    await machine_stream.send_json(
        machine_id=machine_id,
        message=task_cancel_event(machine_id=machine_id, task_id=task_id, attempt_id=attempt_id).as_json(),
    )

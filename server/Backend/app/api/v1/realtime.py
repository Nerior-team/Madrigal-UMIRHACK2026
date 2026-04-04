import json
import queue

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_access_repository, get_current_user
from app.domains.access.repository import AccessRepository
from app.realtime.operator_feed import operator_feed

router = APIRouter(prefix="/realtime", tags=["realtime"])


def _encode_sse(*, event_name: str, payload: dict, event_id: str | None = None) -> str:
    lines: list[str] = []
    if event_id:
        lines.append(f"id: {event_id}")
    lines.append(f"event: {event_name}")
    lines.append(f"data: {json.dumps(payload, ensure_ascii=False)}")
    return "\n".join(lines) + "\n\n"


def _can_receive_event(*, access_repository: AccessRepository, user_id: str, machine_id: str | None) -> bool:
    if machine_id is None:
        return True
    allowed_machine_ids = access_repository.list_machine_ids_for_user(user_id)
    return machine_id in allowed_machine_ids


@router.get("/feed")
async def operator_realtime_feed(
    request: Request,
    current_user=Depends(get_current_user),
    access_repository: AccessRepository = Depends(get_access_repository),
):
    subscription = operator_feed.subscribe()

    async def event_stream():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await run_in_threadpool(subscription.event_queue.get, True, 15)
                except queue.Empty:
                    yield _encode_sse(event_name="ping", payload={"status": "ok"})
                    continue

                if not _can_receive_event(
                    access_repository=access_repository,
                    user_id=current_user.id,
                    machine_id=event.machine_id,
                ):
                    continue
                yield _encode_sse(
                    event_name=event.event_type,
                    event_id=event.event_id,
                    payload=event.as_json(),
                )
        finally:
            operator_feed.unsubscribe(subscription.subscription_id)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.exceptions import AppError
from app.db.session import get_session_factory
from app.domains.access.repository import AccessRepository
from app.domains.machines.repository import MachineRepository
from app.domains.machines.service import MachineService
from app.realtime.machine_stream import machine_stream

router = APIRouter(prefix="/ws")


@router.websocket("/agent/control")
async def agent_control_channel(websocket: WebSocket, machine_token: str) -> None:
    session = get_session_factory()()
    machine_repository = MachineRepository(session)
    access_repository = AccessRepository(session)

    try:
        machine = MachineService(machine_repository, access_repository).authenticate_machine(machine_token=machine_token)
        await machine_stream.connect(machine_id=machine.id, websocket=websocket)
        try:
            while True:
                payload = await websocket.receive_json()
                if payload.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "payload": {"machine_id": machine.id}})
        except WebSocketDisconnect:
            pass
        finally:
            await machine_stream.disconnect(machine_id=machine.id, websocket=websocket)
    except AppError:
        await websocket.close(code=4401)
    finally:
        if session is not None:
            session.close()

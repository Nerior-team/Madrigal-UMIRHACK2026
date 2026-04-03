from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.api.deps import build_client_context, get_access_repository, get_machine_repository
from app.domains.access.repository import AccessRepository
from app.domains.agent_protocol.registration import parse_machine_bearer_token
from app.domains.agent_protocol.schemas import (
    AgentHeartbeatAck,
    AgentRegistrationCompleteResponse,
    AgentRegistrationStartResponse,
)
from app.domains.agent_protocol.service import AgentProtocolService
from app.domains.machines.repository import MachineRepository
from app.domains.machines.schemas import (
    MachineHeartbeatRequest,
    MachineRegistrationCompleteRequest,
    MachineRegistrationStartRequest,
)
from app.domains.machines.service import MachineService

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/registrations/start", response_model=AgentRegistrationStartResponse)
def start_registration(
    payload: MachineRegistrationStartRequest,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
):
    service = AgentProtocolService(MachineService(machine_repository, access_repository))
    return service.start_registration(payload)

@router.post("/registrations/{registration_id}/complete", response_model=AgentRegistrationCompleteResponse)
def complete_registration(
    registration_id: str,
    payload: MachineRegistrationCompleteRequest,
    client=Depends(build_client_context),
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
):
    service = AgentProtocolService(MachineService(machine_repository, access_repository))
    return service.complete_registration(registration_id=registration_id, payload=payload, client=client)


@router.post("/heartbeat", response_model=AgentHeartbeatAck)
def heartbeat(
    payload: MachineHeartbeatRequest,
    client=Depends(build_client_context),
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
):
    machine_token = parse_machine_bearer_token(authorization)
    service = AgentProtocolService(MachineService(machine_repository, access_repository))
    return service.heartbeat(machine_token=machine_token, payload=payload, client=client)

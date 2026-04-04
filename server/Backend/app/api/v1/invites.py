from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import build_client_context, get_access_repository, get_current_user, get_machine_repository
from app.api.deps import get_repository
from app.domains.access.repository import AccessRepository
from app.domains.access.schemas import (
    MachineInviteAcceptResponse,
    MachineInviteCreateRequest,
    MachineInvitePreview,
    MachineInviteRead,
)
from app.domains.access.service import AccessService
from app.domains.auth.repository import AuthRepository
from app.domains.machines.repository import MachineRepository

router = APIRouter(tags=["invites"])


@router.post("/machines/{machine_id}/invites", response_model=MachineInviteRead)
def create_machine_invite(
    machine_id: str,
    payload: MachineInviteCreateRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
):
    return AccessService(access_repository, machine_repository, auth_repository).create_invite(
        machine_id=machine_id,
        actor_user=current_user,
        payload=payload,
        client=client,
    )


@router.get("/invites/{invite_token}", response_model=MachineInvitePreview)
def get_invite_preview(
    invite_token: str,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
):
    return AccessService(access_repository, machine_repository, auth_repository).get_invite_preview(raw_token=invite_token)


@router.post("/invites/{invite_token}/accept", response_model=MachineInviteAcceptResponse)
def accept_invite(
    invite_token: str,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
):
    return AccessService(access_repository, machine_repository, auth_repository).accept_invite(
        raw_token=invite_token,
        actor_user=current_user,
        client=client,
    )

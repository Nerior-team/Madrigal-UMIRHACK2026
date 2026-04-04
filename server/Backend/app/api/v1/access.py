from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import build_client_context, get_access_repository, get_current_user, get_machine_repository
from app.api.deps import get_repository
from app.domains.access.repository import AccessRepository
from app.domains.access.schemas import MachineAccessEntryRead, MachineAccessRevokeRequest, MachineRoleUpdateRequest, MessageResponse
from app.domains.access.service import AccessService
from app.domains.auth.repository import AuthRepository
from app.domains.machines.repository import MachineRepository

router = APIRouter(prefix="/machines/{machine_id}/access", tags=["access"])


@router.get("", response_model=list[MachineAccessEntryRead])
def list_machine_access(
    machine_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
):
    return AccessService(access_repository, machine_repository, auth_repository).list_access(
        machine_id=machine_id,
        actor_user_id=current_user.id,
    )


@router.post("/{access_id}/role", response_model=MachineAccessEntryRead)
def update_machine_access_role(
    machine_id: str,
    access_id: str,
    payload: MachineRoleUpdateRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
):
    return AccessService(access_repository, machine_repository, auth_repository).update_role(
        machine_id=machine_id,
        access_id=access_id,
        actor_user=current_user,
        payload=payload,
        client=client,
    )


@router.post("/{access_id}/revoke", response_model=MessageResponse)
def revoke_machine_access(
    machine_id: str,
    access_id: str,
    payload: MachineAccessRevokeRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
):
    return AccessService(access_repository, machine_repository, auth_repository).revoke_access(
        machine_id=machine_id,
        access_id=access_id,
        actor_user=current_user,
        payload=payload,
        client=client,
    )

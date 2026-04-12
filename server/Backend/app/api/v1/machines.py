from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import (
    build_client_context,
    get_access_repository,
    get_current_user,
    get_machine_repository,
    get_profile_repository,
)
from app.domains.access.repository import AccessRepository
from app.domains.machines.repository import MachineRepository
from app.domains.profile.repository import ProfileRepository
from app.domains.machines.schemas import MachineDetail, MachineRegistrationConfirmRequest, MachineRegistrationConfirmResponse, MachineSummary
from app.domains.machines.service import MachineService

router = APIRouter(prefix="/machines", tags=["machines"])


@router.get("", response_model=list[MachineSummary])
def list_machines(
    current_user=Depends(get_current_user),
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    profile_repository: Annotated[ProfileRepository, Depends(get_profile_repository)] = None,
):
    retention = profile_repository.get_or_create_profile(current_user.id).deleted_machine_retention
    return MachineService(machine_repository, access_repository).list_for_user(
        actor_user_id=current_user.id,
        retention=retention,
    )


@router.get("/{machine_id}", response_model=MachineDetail)
def get_machine(
    machine_id: str,
    current_user=Depends(get_current_user),
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    profile_repository: Annotated[ProfileRepository, Depends(get_profile_repository)] = None,
):
    retention = profile_repository.get_or_create_profile(current_user.id).deleted_machine_retention
    return MachineService(machine_repository, access_repository).get_detail_for_user(
        machine_id=machine_id,
        actor_user_id=current_user.id,
        retention=retention,
    )


@router.post("/registrations/confirm", response_model=MachineRegistrationConfirmResponse)
def confirm_machine_registration(
    payload: MachineRegistrationConfirmRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
):
    return MachineService(machine_repository, access_repository).confirm_registration(
        actor_user=current_user,
        payload=payload,
        client=client,
    )

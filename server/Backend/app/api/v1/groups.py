from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import (
    build_client_context,
    get_access_repository,
    get_current_user,
    get_group_repository,
    get_machine_repository,
    get_result_repository,
    get_task_repository,
)
from app.domains.access.repository import AccessRepository
from app.domains.groups.repository import GroupRepository
from app.domains.groups.schemas import (
    GroupActionResponse,
    GroupAddMachineRequest,
    GroupCreateRequest,
    GroupDetailRead,
    GroupRead,
    GroupUpdateRequest,
)
from app.domains.groups.service import GroupService
from app.domains.machines.repository import MachineRepository
from app.domains.results.repository import ResultRepository
from app.domains.results.schemas import ResultHistoryEntryRead
from app.domains.results.service import ResultService
from app.domains.tasks.repository import TaskRepository
from app.domains.tasks.schemas import TaskRead
from app.domains.tasks.service import TaskService

router = APIRouter(prefix="/groups", tags=["groups"])


def _build_group_service(
    *,
    group_repository: GroupRepository,
    access_repository: AccessRepository,
    machine_repository: MachineRepository,
) -> GroupService:
    return GroupService(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    )


@router.get("", response_model=list[GroupRead])
def list_groups(
    current_user=Depends(get_current_user),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    ).list_groups(actor_user_id=current_user.id)


@router.post("", response_model=GroupRead)
def create_group(
    payload: GroupCreateRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    ).create_group(actor_user=current_user, payload=payload, client=client)


@router.get("/{group_id}", response_model=GroupDetailRead)
def get_group(
    group_id: str,
    current_user=Depends(get_current_user),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    ).get_group(actor_user_id=current_user.id, group_id=group_id)


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(
    group_id: str,
    payload: GroupUpdateRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    ).update_group(actor_user=current_user, group_id=group_id, payload=payload, client=client)


@router.delete("/{group_id}", response_model=GroupActionResponse)
def delete_group(
    group_id: str,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    ).delete_group(actor_user=current_user, group_id=group_id, client=client)


@router.post("/{group_id}/machines", response_model=GroupDetailRead)
def add_machine_to_group(
    group_id: str,
    payload: GroupAddMachineRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    ).add_machine(actor_user=current_user, group_id=group_id, machine_id=payload.machine_id, client=client)


@router.delete("/{group_id}/machines/{machine_id}", response_model=GroupActionResponse)
def remove_machine_from_group(
    group_id: str,
    machine_id: str,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    ).remove_machine(actor_user=current_user, group_id=group_id, machine_id=machine_id, client=client)


@router.get("/{group_id}/tasks", response_model=list[TaskRead])
def list_group_tasks(
    group_id: str,
    current_user=Depends(get_current_user),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    group_service = _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    )
    machine_ids = group_service.resolve_group_machine_ids(actor_user_id=current_user.id, group_id=group_id)
    return TaskService(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=None,
        task_repository=task_repository,
        result_repository=result_repository,
    ).list_tasks_for_machine_ids(actor_user_id=current_user.id, machine_ids=machine_ids)


@router.get("/{group_id}/results", response_model=list[ResultHistoryEntryRead])
def list_group_results(
    group_id: str,
    template_key: str | None = None,
    current_user=Depends(get_current_user),
    group_repository: Annotated[GroupRepository, Depends(get_group_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    group_service = _build_group_service(
        group_repository=group_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
    )
    machine_ids = group_service.resolve_group_machine_ids(actor_user_id=current_user.id, group_id=group_id)
    return ResultService(
        result_repository=result_repository,
        task_repository=task_repository,
        machine_repository=machine_repository,
        access_repository=access_repository,
    ).list_machine_history_for_machine_ids(
        actor_user_id=current_user.id,
        machine_ids=machine_ids,
        template_key=template_key,
    )

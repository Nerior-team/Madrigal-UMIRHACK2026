from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import (
    build_client_context,
    get_access_repository,
    get_command_repository,
    get_current_user,
    get_machine_repository,
    get_repository,
)
from app.domains.access.repository import AccessRepository
from app.domains.access.schemas import MessageResponse
from app.domains.auth.repository import AuthRepository
from app.domains.commands.repository import CommandRepository
from app.domains.commands.schemas import (
    CommandTemplatesResetRequest,
    MachineCommandTemplateCreateRequest,
    MachineCommandTemplateRead,
    MachineCommandTemplateUpdateRequest,
)
from app.domains.commands.service import CommandService
from app.domains.machines.repository import MachineRepository

router = APIRouter(prefix="/machines/{machine_id}/commands", tags=["commands"])


def _build_service(
    *,
    access_repository: AccessRepository,
    machine_repository: MachineRepository,
    auth_repository: AuthRepository,
    command_repository: CommandRepository,
) -> CommandService:
    return CommandService(
        access_repository=access_repository,
        machine_repository=machine_repository,
        auth_repository=auth_repository,
        command_repository=command_repository,
    )


@router.get("/templates", response_model=list[MachineCommandTemplateRead])
def list_command_templates(
    machine_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
):
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        auth_repository=auth_repository,
        command_repository=command_repository,
    ).list_templates_for_machine(machine_id=machine_id, actor_user_id=current_user.id)


@router.post("/templates", response_model=MachineCommandTemplateRead)
def create_command_template(
    machine_id: str,
    payload: MachineCommandTemplateCreateRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
):
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        auth_repository=auth_repository,
        command_repository=command_repository,
    ).create_custom_template(machine_id=machine_id, actor_user=current_user, payload=payload, client=client)


@router.patch("/templates/{template_id}", response_model=MachineCommandTemplateRead)
def update_command_template(
    machine_id: str,
    template_id: str,
    payload: MachineCommandTemplateUpdateRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
):
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        auth_repository=auth_repository,
        command_repository=command_repository,
    ).update_custom_template(
        machine_id=machine_id,
        template_id=template_id,
        actor_user=current_user,
        payload=payload,
        client=client,
    )


@router.delete("/templates/{template_id}", response_model=MessageResponse)
def delete_command_template(
    machine_id: str,
    template_id: str,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
):
    _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        auth_repository=auth_repository,
        command_repository=command_repository,
    ).delete_custom_template(machine_id=machine_id, template_id=template_id, actor_user=current_user, client=client)
    return MessageResponse(message="Шаблон команды удалён.")


@router.post("/templates/reset", response_model=MessageResponse)
def reset_command_templates(
    machine_id: str,
    payload: CommandTemplatesResetRequest,
    current_user=Depends(get_current_user),
    client=Depends(build_client_context),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
):
    removed_count = _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        auth_repository=auth_repository,
        command_repository=command_repository,
    ).reset_custom_templates(machine_id=machine_id, actor_user=current_user, payload=payload, client=client)
    return MessageResponse(message=f"Пользовательские шаблоны сброшены: {removed_count}.")

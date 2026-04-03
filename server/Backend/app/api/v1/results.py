from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import (
    get_access_repository,
    get_command_repository,
    get_current_user,
    get_machine_repository,
    get_result_repository,
    get_task_repository,
)
from app.domains.access.repository import AccessRepository
from app.domains.commands.repository import CommandRepository
from app.domains.machines.repository import MachineRepository
from app.domains.results.repository import ResultRepository
from app.domains.results.schemas import CommandExecutionResultRead
from app.domains.tasks.repository import TaskRepository
from app.domains.tasks.service import TaskService

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/{result_id}", response_model=CommandExecutionResultRead)
def get_result(
    result_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    return TaskService(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).get_result(actor_user_id=current_user.id, result_id=result_id)

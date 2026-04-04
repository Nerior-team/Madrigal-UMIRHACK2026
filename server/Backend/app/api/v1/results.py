from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_access_repository, get_current_user, get_machine_repository, get_result_repository, get_task_repository
from app.domains.access.repository import AccessRepository
from app.domains.machines.repository import MachineRepository
from app.domains.results.repository import ResultRepository
from app.domains.results.schemas import CommandExecutionResultRead, ResultDiffRead, ResultHistoryEntryRead
from app.domains.results.service import ResultService
from app.domains.tasks.repository import TaskRepository
from app.domains.tasks.service import TaskService

router = APIRouter(tags=["results"])


def _build_service(
    *,
    access_repository: AccessRepository,
    machine_repository: MachineRepository,
    task_repository: TaskRepository,
    result_repository: ResultRepository,
) -> ResultService:
    return ResultService(
        result_repository,
        task_repository,
        machine_repository,
        access_repository,
    )


@router.get("/results/diff", response_model=ResultDiffRead)
def diff_results(
    left_result_id: str,
    right_result_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).diff_results(
        actor_user_id=current_user.id,
        left_result_id=left_result_id,
        right_result_id=right_result_id,
    )


@router.get("/machines/{machine_id}/results", response_model=list[ResultHistoryEntryRead])
def list_machine_results(
    machine_id: str,
    template_key: str | None = None,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    return _build_service(
        access_repository=access_repository,
        machine_repository=machine_repository,
        task_repository=task_repository,
        result_repository=result_repository,
    ).list_machine_history(actor_user_id=current_user.id, machine_id=machine_id, template_key=template_key)


@router.get("/results/{result_id}", response_model=CommandExecutionResultRead)
def get_result(
    result_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
):
    return TaskService(
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=None,
        task_repository=task_repository,
        result_repository=result_repository,
    ).get_result(actor_user_id=current_user.id, result_id=result_id)

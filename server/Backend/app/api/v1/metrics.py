from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_access_repository, get_current_user, get_machine_repository, get_task_repository
from app.domains.access.repository import AccessRepository
from app.domains.machines.repository import MachineRepository
from app.domains.metrics.schemas import MachineMetricsRead
from app.domains.metrics.service import MetricsService
from app.domains.tasks.repository import TaskRepository

router = APIRouter(prefix="/machines/{machine_id}/metrics", tags=["metrics"])


@router.get("", response_model=MachineMetricsRead)
def get_machine_metrics(
    machine_id: str,
    current_user=Depends(get_current_user),
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
):
    return MetricsService(
        task_repository=task_repository,
        machine_repository=machine_repository,
        access_repository=access_repository,
    ).get_machine_metrics(actor_user_id=current_user.id, machine_id=machine_id)

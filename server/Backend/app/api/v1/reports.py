from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_access_repository, get_current_user, get_machine_repository, get_db_session
from app.domains.access.repository import AccessRepository
from app.domains.machines.repository import MachineRepository
from app.domains.reports.repository import ReportsRepository
from app.domains.reports.schemas import ReportExportRead, ResultSummaryRead, TaskSummaryRead
from app.domains.reports.service import ReportsService
from sqlalchemy.orm import Session

router = APIRouter(tags=["reports"])


def _build_service(
    *,
    db: Session,
    machine_repository: MachineRepository,
    access_repository: AccessRepository,
) -> ReportsService:
    return ReportsService(
        reports_repository=ReportsRepository(db),
        machine_repository=machine_repository,
        access_repository=access_repository,
    )


@router.get("/results/{result_id}/summary", response_model=ResultSummaryRead)
def get_result_summary(
    result_id: str,
    current_user=Depends(get_current_user),
    db: Annotated[Session, Depends(get_db_session)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_service(
        db=db,
        machine_repository=machine_repository,
        access_repository=access_repository,
    ).get_result_summary(actor_user_id=current_user.id, result_id=result_id)


@router.get("/tasks/{task_id}/summary", response_model=TaskSummaryRead)
def get_task_summary(
    task_id: str,
    current_user=Depends(get_current_user),
    db: Annotated[Session, Depends(get_db_session)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_service(
        db=db,
        machine_repository=machine_repository,
        access_repository=access_repository,
    ).get_task_summary(actor_user_id=current_user.id, task_id=task_id)


@router.get("/results/{result_id}/export/json", response_model=ReportExportRead)
def export_result_json(
    result_id: str,
    current_user=Depends(get_current_user),
    db: Annotated[Session, Depends(get_db_session)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_service(
        db=db,
        machine_repository=machine_repository,
        access_repository=access_repository,
    ).export_result_json(actor_user_id=current_user.id, result_id=result_id)


@router.get("/tasks/{task_id}/export/json", response_model=ReportExportRead)
def export_task_json(
    task_id: str,
    current_user=Depends(get_current_user),
    db: Annotated[Session, Depends(get_db_session)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_service(
        db=db,
        machine_repository=machine_repository,
        access_repository=access_repository,
    ).export_task_json(actor_user_id=current_user.id, task_id=task_id)


@router.get("/machines/{machine_id}/exports/json", response_model=ReportExportRead)
def export_machine_history_json(
    machine_id: str,
    current_user=Depends(get_current_user),
    db: Annotated[Session, Depends(get_db_session)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
):
    return _build_service(
        db=db,
        machine_repository=machine_repository,
        access_repository=access_repository,
    ).export_machine_history_json(actor_user_id=current_user.id, machine_id=machine_id)

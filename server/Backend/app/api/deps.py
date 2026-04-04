from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import hash_token
from app.db.session import get_db_session
from app.domains.access.repository import AccessRepository
from app.domains.auth.repository import AuthRepository
from app.domains.commands.repository import CommandRepository
from app.domains.integrations.external_api.repository import ExternalApiRepository
from app.domains.integrations.external_api.service import ExternalApiClientContext, ExternalApiService
from app.domains.machines.repository import MachineRepository
from app.domains.reports.repository import ReportsRepository
from app.domains.results.repository import ResultRepository
from app.domains.tasks.repository import TaskRepository
from app.shared.time import utc_now


def get_repository(db: Annotated[Session, Depends(get_db_session)]) -> AuthRepository:
    return AuthRepository(db)


def get_machine_repository(db: Annotated[Session, Depends(get_db_session)]) -> MachineRepository:
    return MachineRepository(db)


def get_access_repository(db: Annotated[Session, Depends(get_db_session)]) -> AccessRepository:
    return AccessRepository(db)


def get_command_repository(db: Annotated[Session, Depends(get_db_session)]) -> CommandRepository:
    return CommandRepository(db)


def get_task_repository(db: Annotated[Session, Depends(get_db_session)]) -> TaskRepository:
    return TaskRepository(db)


def get_result_repository(db: Annotated[Session, Depends(get_db_session)]) -> ResultRepository:
    return ResultRepository(db)


def get_reports_repository(db: Annotated[Session, Depends(get_db_session)]) -> ReportsRepository:
    return ReportsRepository(db)


def get_external_api_repository(db: Annotated[Session, Depends(get_db_session)]) -> ExternalApiRepository:
    return ExternalApiRepository(db)


def build_client_context(request: Request):
    from app.domains.auth.service import ClientContext

    return ClientContext(
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


def build_external_api_client_context(request: Request) -> ExternalApiClientContext:
    return ExternalApiClientContext(
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


def get_current_access_token(
    request: Request,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> str:
    session_cookie = request.cookies.get(get_settings().backend_cookie_name)
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip()
    if session_cookie:
        return session_cookie
    raise AppError("unauthorized", "Требуется авторизация.", 401)


def get_current_session(
    repository: Annotated[AuthRepository, Depends(get_repository)],
    access_token: Annotated[str, Depends(get_current_access_token)],
):
    session = repository.get_session_by_access_hash(hash_token(access_token, purpose="access"))
    if session is None or session.revoked_at is not None or session.access_expires_at < utc_now():
        raise AppError("unauthorized", "Сессия недействительна.", 401)
    return session


def get_current_user(
    repository: Annotated[AuthRepository, Depends(get_repository)],
    current_session=Depends(get_current_session),
):
    user = repository.get_user_by_id(current_session.user_id)
    if user is None:
        raise AppError("unauthorized", "Пользователь не найден.", 401)
    return user


@dataclass(slots=True)
class MachineAccessContext:
    machine: object
    access: object
    ownership: object | None
    is_creator_owner: bool


def get_machine_access_context(
    machine_id: str,
    current_user=Depends(get_current_user),
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
) -> MachineAccessContext:
    machine = machine_repository.get_machine(machine_id)
    if machine is None:
        raise AppError("machine_not_found", "Машина не найдена.", 404)

    access = access_repository.get_access(machine_id, current_user.id)
    if access is None or access.revoked_at is not None:
        raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)

    ownership = access_repository.get_ownership(machine_id)
    return MachineAccessContext(
        machine=machine,
        access=access,
        ownership=ownership,
        is_creator_owner=ownership is not None and ownership.creator_user_id == current_user.id,
    )


def get_external_api_principal(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    client: Annotated[ExternalApiClientContext, Depends(build_external_api_client_context)] = None,
    auth_repository: Annotated[AuthRepository, Depends(get_repository)] = None,
    external_api_repository: Annotated[ExternalApiRepository, Depends(get_external_api_repository)] = None,
    access_repository: Annotated[AccessRepository, Depends(get_access_repository)] = None,
    machine_repository: Annotated[MachineRepository, Depends(get_machine_repository)] = None,
    command_repository: Annotated[CommandRepository, Depends(get_command_repository)] = None,
    task_repository: Annotated[TaskRepository, Depends(get_task_repository)] = None,
    result_repository: Annotated[ResultRepository, Depends(get_result_repository)] = None,
    reports_repository: Annotated[ReportsRepository, Depends(get_reports_repository)] = None,
):
    if authorization is None or not authorization.startswith("Bearer "):
        raise AppError("api_key_missing", "Требуется API-ключ.", 401)
    raw_key = authorization.removeprefix("Bearer ").strip()
    return ExternalApiService(
        auth_repository=auth_repository,
        external_api_repository=external_api_repository,
        access_repository=access_repository,
        machine_repository=machine_repository,
        command_repository=command_repository,
        task_repository=task_repository,
        result_repository=result_repository,
        reports_repository=reports_repository,
    ).authenticate_api_key(raw_key=raw_key, client=client)

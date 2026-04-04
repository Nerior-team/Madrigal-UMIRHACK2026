from dataclasses import dataclass
from datetime import timedelta

from app.core.exceptions import AppError
from app.core.ids import generate_prefixed_id
from app.core.security import generate_api_key_secret, hash_api_key_secret, hash_token, verify_api_key_secret
from app.domains.auth.repository import AuthRepository
from app.domains.commands.repository import CommandRepository
from app.domains.commands.service import CommandService
from app.domains.integrations.external_api.repository import ExternalApiRepository
from app.domains.integrations.external_api.schemas import (
    ApiKeyCreateRequest,
    ApiKeyCreateResponse,
    ApiKeyRead,
    ExternalApiPrincipal,
)
from app.domains.machines.repository import MachineRepository
from app.domains.machines.service import MachineClientContext, MachineService
from app.domains.reports.repository import ReportsRepository
from app.domains.reports.service import ReportsService
from app.domains.results.repository import ResultRepository
from app.domains.results.service import ResultService
from app.domains.tasks.repository import TaskRepository
from app.domains.tasks.schemas import TaskCreateRequest
from app.domains.tasks.service import TaskService
from app.infra.observability.audit import record_audit_event
from app.shared.enums import ApiKeyExpiryPreset, ApiKeyPermission, AuditStatus, AuthChallengeKind, TaskStatus
from app.shared.time import has_expired, utc_now


@dataclass(slots=True)
class ExternalApiClientContext:
    ip_address: str | None
    user_agent: str | None


class ExternalApiService:
    def __init__(
        self,
        *,
        auth_repository: AuthRepository,
        external_api_repository: ExternalApiRepository,
        access_repository,
        machine_repository: MachineRepository,
        command_repository: CommandRepository,
        task_repository: TaskRepository,
        result_repository: ResultRepository,
        reports_repository: ReportsRepository,
    ) -> None:
        self.auth_repository = auth_repository
        self.external_api_repository = external_api_repository
        self.access_repository = access_repository
        self.machine_repository = machine_repository
        self.command_repository = command_repository
        self.task_repository = task_repository
        self.result_repository = result_repository
        self.reports_repository = reports_repository
        self.command_service = CommandService(
            access_repository=access_repository,
            machine_repository=machine_repository,
            command_repository=command_repository,
        )
        self.machine_service = MachineService(machine_repository, access_repository)
        self.task_service = TaskService(
            access_repository=access_repository,
            machine_repository=machine_repository,
            command_repository=command_repository,
            task_repository=task_repository,
            result_repository=result_repository,
        )
        self.result_service = ResultService(
            result_repository=result_repository,
            task_repository=task_repository,
            machine_repository=machine_repository,
            access_repository=access_repository,
        )
        self.reports_service = ReportsService(
            reports_repository=reports_repository,
            machine_repository=machine_repository,
            access_repository=access_repository,
        )

    def _expiry_settings(self, preset: ApiKeyExpiryPreset) -> tuple[int | None, object | None]:
        now = utc_now()
        if preset == ApiKeyExpiryPreset.ONE_TIME:
            return 1, now + timedelta(minutes=15)
        if preset == ApiKeyExpiryPreset.DAY:
            return None, now + timedelta(days=1)
        if preset == ApiKeyExpiryPreset.WEEK:
            return None, now + timedelta(weeks=1)
        if preset == ApiKeyExpiryPreset.MONTH:
            return None, now + timedelta(days=30)
        if preset == ApiKeyExpiryPreset.YEAR:
            return None, now + timedelta(days=365)
        return None, None

    def _require_valid_reauth(self, *, user_id: str, reauth_token: str) -> None:
        challenge = self.auth_repository.get_valid_auth_challenge_by_payload_hash(
            user_id=user_id,
            challenge_kind=AuthChallengeKind.REAUTH,
            payload_hash=hash_token(reauth_token, purpose="reauth"),
        )
        if challenge is None:
            raise AppError("reauth_required", "Требуется повторное подтверждение личности.", 401)
        challenge.consumed_at = utc_now()
        self.auth_repository.save(challenge)

    def _normalize_machine_ids(self, machine_ids: list[str]) -> list[str]:
        unique_machine_ids = list(dict.fromkeys(machine_ids))
        if not unique_machine_ids:
            raise AppError("api_key_machine_scope_required", "Нужно выбрать хотя бы одну машину.", 400)
        return unique_machine_ids

    def _validate_machine_scope(self, *, actor_user_id: str, machine_ids: list[str]) -> None:
        for machine_id in machine_ids:
            machine = self.machine_repository.get_machine(machine_id)
            if machine is None:
                raise AppError("machine_not_found", "Машина не найдена.", 404)
            ownership = self.access_repository.get_ownership(machine_id)
            if ownership is None or ownership.creator_user_id != actor_user_id:
                raise AppError(
                    "api_key_machine_scope_denied",
                    "API-ключ можно привязать только к машинам, где пользователь является создателем.",
                    403,
                )

    def _validate_template_scope(self, *, machine_ids: list[str], template_keys: list[str]) -> list[str]:
        unique_template_keys = list(dict.fromkeys(template_keys))
        for machine_id in machine_ids:
            for template_key in unique_template_keys:
                self.command_service.resolve_template_for_machine(
                    machine_id=machine_id,
                    template_key=template_key,
                    params={},
                )
        return unique_template_keys

    def _build_key_read(self, api_key) -> ApiKeyRead:
        machine_ids = self.external_api_repository.list_machine_scopes(api_key.id)
        template_keys = self.external_api_repository.list_template_scopes(api_key.id)
        expired = api_key.expires_at is not None and has_expired(api_key.expires_at)
        return ApiKeyRead(
            id=api_key.id,
            public_id=api_key.public_id,
            name=api_key.name,
            permission=api_key.permission,
            machine_ids=machine_ids,
            allowed_template_keys=template_keys,
            usage_limit=api_key.usage_limit,
            uses_count=api_key.uses_count,
            expires_at=api_key.expires_at,
            last_used_at=api_key.last_used_at,
            last_used_ip=api_key.last_used_ip,
            created_at=api_key.created_at,
            revoked_at=api_key.revoked_at,
            is_active=api_key.revoked_at is None and not expired,
        )

    def list_api_keys(self, *, actor_user_id: str) -> list[ApiKeyRead]:
        keys = self.external_api_repository.list_api_keys_for_user(actor_user_id)
        return [self._build_key_read(item) for item in keys]

    def get_api_key(self, *, actor_user_id: str, key_id: str) -> ApiKeyRead:
        api_key = self.external_api_repository.get_api_key_for_user(key_id=key_id, owner_user_id=actor_user_id)
        if api_key is None:
            raise AppError("api_key_not_found", "API-ключ не найден.", 404)
        return self._build_key_read(api_key)

    def create_api_key(self, *, actor_user, payload: ApiKeyCreateRequest, client: ExternalApiClientContext) -> ApiKeyCreateResponse:
        machine_ids = self._normalize_machine_ids(payload.machine_ids)
        self._validate_machine_scope(actor_user_id=actor_user.id, machine_ids=machine_ids)
        template_keys = self._validate_template_scope(machine_ids=machine_ids, template_keys=payload.allowed_template_keys)
        self._require_valid_reauth(user_id=actor_user.id, reauth_token=payload.reauth_token)
        usage_limit, expires_at = self._expiry_settings(payload.expiry_preset)

        secret = generate_api_key_secret()
        public_id = generate_prefixed_id("key")
        api_key = self.external_api_repository.create_api_key(
            public_id=public_id,
            owner_user_id=actor_user.id,
            name=payload.name.strip(),
            token_hash=hash_api_key_secret(secret),
            permission=payload.permission,
            usage_limit=usage_limit,
            expires_at=expires_at,
        )
        for machine_id in machine_ids:
            self.external_api_repository.add_machine_scope(api_key_id=api_key.id, machine_id=machine_id)
        for template_key in template_keys:
            self.external_api_repository.add_template_scope(api_key_id=api_key.id, template_key=template_key)

        record_audit_event(
            self.external_api_repository,
            user_id=actor_user.id,
            action="external_api.key_created",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={
                "api_key_id": api_key.id,
                "public_id": api_key.public_id,
                "permission": api_key.permission.value,
                "machine_ids": machine_ids,
                "allowed_template_keys": template_keys,
            },
        )
        self.external_api_repository.commit()
        return ApiKeyCreateResponse(
            key=self._build_key_read(api_key),
            raw_key=f"pmv.{public_id}.{secret}",
        )

    def revoke_api_key(self, *, actor_user, key_id: str, reauth_token: str, client: ExternalApiClientContext) -> None:
        api_key = self.external_api_repository.get_api_key_for_user(key_id=key_id, owner_user_id=actor_user.id)
        if api_key is None:
            raise AppError("api_key_not_found", "API-ключ не найден.", 404)
        self._require_valid_reauth(user_id=actor_user.id, reauth_token=reauth_token)
        api_key.revoked_at = utc_now()
        self.external_api_repository.save(api_key)
        record_audit_event(
            self.external_api_repository,
            user_id=actor_user.id,
            action="external_api.key_revoked",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"api_key_id": api_key.id, "public_id": api_key.public_id},
        )
        self.external_api_repository.commit()

    def authenticate_api_key(self, *, raw_key: str, client: ExternalApiClientContext) -> ExternalApiPrincipal:
        parts = raw_key.strip().split(".")
        if len(parts) != 3 or parts[0] != "pmv":
            raise AppError("api_key_invalid", "API-ключ недействителен.", 401)

        public_id, secret = parts[1], parts[2]
        api_key = self.external_api_repository.get_api_key_by_public_id(public_id)
        if api_key is None or api_key.revoked_at is not None:
            raise AppError("api_key_invalid", "API-ключ недействителен.", 401)
        if api_key.expires_at is not None and has_expired(api_key.expires_at):
            raise AppError("api_key_expired", "Срок действия API-ключа истёк.", 401)
        if api_key.usage_limit is not None and api_key.uses_count >= api_key.usage_limit:
            raise AppError("api_key_exhausted", "Лимит использования API-ключа исчерпан.", 401)
        if not verify_api_key_secret(secret, api_key.token_hash):
            raise AppError("api_key_invalid", "API-ключ недействителен.", 401)

        user = self.auth_repository.get_user_by_id(api_key.owner_user_id)
        if user is None:
            raise AppError("api_key_invalid", "API-ключ недействителен.", 401)

        api_key.uses_count += 1
        api_key.last_used_at = utc_now()
        api_key.last_used_ip = client.ip_address
        api_key.last_used_user_agent = client.user_agent
        self.external_api_repository.save(api_key)
        self.external_api_repository.commit()
        return ExternalApiPrincipal(
            user=user,
            key=api_key,
            machine_ids=set(self.external_api_repository.list_machine_scopes(api_key.id)),
            template_keys=set(self.external_api_repository.list_template_scopes(api_key.id)),
            permission=api_key.permission,
        )

    def _require_machine_scope(self, *, principal: ExternalApiPrincipal, machine_id: str) -> None:
        if machine_id not in principal.machine_ids:
            raise AppError("api_key_machine_scope_denied", "API-ключ не привязан к этой машине.", 403)

    def _require_run_permission(self, *, principal: ExternalApiPrincipal) -> None:
        if principal.permission != ApiKeyPermission.RUN:
            raise AppError("api_key_permission_denied", "API-ключ не имеет права запускать задачи.", 403)

    def _require_template_scope(self, *, principal: ExternalApiPrincipal, template_key: str) -> None:
        if principal.template_keys and template_key not in principal.template_keys:
            raise AppError("api_key_template_scope_denied", "Шаблон недоступен для этого API-ключа.", 403)

    def list_machines(self, *, principal: ExternalApiPrincipal):
        machines = self.machine_service.list_for_user(actor_user_id=principal.user.id)
        return [machine for machine in machines if machine.id in principal.machine_ids]

    def get_machine(self, *, principal: ExternalApiPrincipal, machine_id: str):
        self._require_machine_scope(principal=principal, machine_id=machine_id)
        return self.machine_service.get_detail_for_user(machine_id=machine_id, actor_user_id=principal.user.id)

    def list_machine_commands(self, *, principal: ExternalApiPrincipal, machine_id: str):
        self._require_machine_scope(principal=principal, machine_id=machine_id)
        commands = self.command_service.list_templates_for_machine(
            machine_id=machine_id,
            actor_user_id=principal.user.id,
        )
        if not principal.template_keys:
            return commands
        return [command for command in commands if command.template_key in principal.template_keys]

    def create_task(self, *, principal: ExternalApiPrincipal, payload: TaskCreateRequest, client: ExternalApiClientContext):
        self._require_run_permission(principal=principal)
        self._require_machine_scope(principal=principal, machine_id=payload.machine_id)
        self._require_template_scope(principal=principal, template_key=payload.template_key)
        task = self.task_service.create_task(
            actor_user=principal.user,
            payload=payload,
            client=MachineClientContext(ip_address=client.ip_address, user_agent=client.user_agent),
        )
        record_audit_event(
            self.external_api_repository,
            user_id=principal.user.id,
            action="external_api.task_created",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={
                "api_key_id": principal.key.id,
                "task_id": task.id,
                "machine_id": task.machine_id,
                "template_key": task.template_key,
            },
        )
        self.external_api_repository.commit()
        return task

    def should_notify_machine(self, *, machine_id: str) -> bool:
        return self.task_service.should_notify_machine(machine_id=machine_id)

    def get_task(self, *, principal: ExternalApiPrincipal, task_id: str):
        task = self.task_repository.get_task(task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        self._require_machine_scope(principal=principal, machine_id=task.machine_id)
        return self.task_service.get_task(actor_user_id=principal.user.id, task_id=task_id)

    def get_task_logs(self, *, principal: ExternalApiPrincipal, task_id: str):
        task = self.task_repository.get_task(task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        self._require_machine_scope(principal=principal, machine_id=task.machine_id)
        return self.task_service.get_task_logs(actor_user_id=principal.user.id, task_id=task_id)

    def get_result(self, *, principal: ExternalApiPrincipal, result_id: str):
        result = self.result_repository.get_result(result_id)
        if result is None:
            raise AppError("task_result_not_found", "Результат выполнения не найден.", 404)
        task = self.task_repository.get_task(result.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        self._require_machine_scope(principal=principal, machine_id=task.machine_id)
        return self.task_service.get_result(actor_user_id=principal.user.id, result_id=result_id)

    def get_result_summary(self, *, principal: ExternalApiPrincipal, result_id: str):
        result = self.result_repository.get_result(result_id)
        if result is None:
            raise AppError("task_result_not_found", "Результат выполнения не найден.", 404)
        task = self.task_repository.get_task(result.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        self._require_machine_scope(principal=principal, machine_id=task.machine_id)
        return self.reports_service.get_result_summary(actor_user_id=principal.user.id, result_id=result_id)

    def export_result_json(self, *, principal: ExternalApiPrincipal, result_id: str):
        result = self.result_repository.get_result(result_id)
        if result is None:
            raise AppError("task_result_not_found", "Результат выполнения не найден.", 404)
        task = self.task_repository.get_task(result.task_id)
        if task is None:
            raise AppError("task_not_found", "Задача не найдена.", 404)
        self._require_machine_scope(principal=principal, machine_id=task.machine_id)
        return self.reports_service.export_result_json(actor_user_id=principal.user.id, result_id=result_id)

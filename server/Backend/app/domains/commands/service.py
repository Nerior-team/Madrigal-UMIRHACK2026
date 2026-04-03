from dataclasses import dataclass

from app.core.exceptions import AppError
from app.core.ids import generate_prefixed_id
from app.domains.access.repository import AccessRepository
from app.domains.access.roles import ensure_can_manage_commands, ensure_can_run_tasks
from app.domains.commands.repository import CommandRepository
from app.domains.commands.runners import get_builtin_template, list_builtin_templates
from app.domains.commands.schemas import (
    MachineCommandTemplateCreateRequest,
    MachineCommandTemplateParameterRead,
    MachineCommandTemplateRead,
    MachineCommandTemplateUpdateRequest,
    RenderedCommandRead,
)
from app.domains.commands.validation import (
    ensure_command_pattern_safe,
    ensure_placeholders_match,
    ensure_runner_allowed_for_machine,
    normalize_param_values,
    render_command,
    validate_parameter_definitions,
)
from app.domains.machines.repository import MachineRepository
from app.infra.observability.audit import record_audit_event
from app.shared.enums import AuditStatus, TaskKind


@dataclass(slots=True)
class ResolvedTemplate:
    template_key: str
    template_name: str
    runner: object
    parser_kind: object
    command: str
    params: dict[str, str]
    is_builtin: bool
    task_kind: TaskKind


class CommandService:
    def __init__(
        self,
        *,
        access_repository: AccessRepository,
        machine_repository: MachineRepository,
        command_repository: CommandRepository | None = None,
    ) -> None:
        self.access_repository = access_repository
        self.machine_repository = machine_repository
        self.command_repository = command_repository or CommandRepository(machine_repository.db)

    def _require_machine(self, machine_id: str):
        machine = self.machine_repository.get_machine(machine_id)
        if machine is None:
            raise AppError("machine_not_found", "Машина не найдена.", 404)
        return machine

    def _require_access(self, *, machine_id: str, actor_user_id: str):
        access = self.access_repository.get_access(machine_id, actor_user_id)
        if access is None or access.revoked_at is not None:
            raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)
        ownership = self.access_repository.get_ownership(machine_id)
        return access, ownership

    def _build_parameter_reads(self, parameters_schema: list[dict] | None) -> list[MachineCommandTemplateParameterRead]:
        return [
            MachineCommandTemplateParameterRead(
                key=item["key"],
                label=item["label"],
                type=item["type"],
                allowed_values=item["allowed_values"],
            )
            for item in (parameters_schema or [])
        ]

    def _build_template_read(self, template, *, is_builtin: bool) -> MachineCommandTemplateRead:
        return MachineCommandTemplateRead(
            id=getattr(template, "id", None),
            template_key=template.template_key,
            name=template.name,
            description=template.description,
            runner=template.runner,
            command_pattern=template.command_pattern,
            parameters=self._build_parameter_reads(getattr(template, "parameters_schema", None)),
            parser_kind=template.parser_kind,
            is_builtin=is_builtin,
            is_enabled=getattr(template, "is_enabled", True),
            machine_id=getattr(template, "machine_id", None),
            created_by_user_id=getattr(template, "created_by_user_id", None),
            created_at=getattr(template, "created_at", None),
        )

    def list_templates_for_machine(self, *, machine_id: str, actor_user_id: str) -> list[MachineCommandTemplateRead]:
        machine = self._require_machine(machine_id)
        access, _ = self._require_access(machine_id=machine_id, actor_user_id=actor_user_id)
        ensure_can_run_tasks(access.role)

        builtins = [
            MachineCommandTemplateRead(
                id=None,
                template_key=definition.template_key,
                name=definition.name,
                description=definition.description,
                runner=definition.runner_for(machine.os_family),
                command_pattern=definition.render(machine.os_family),
                parameters=definition.parameters_for(),
                parser_kind=definition.parser_kind,
                is_builtin=True,
                is_enabled=True,
                machine_id=None,
                created_by_user_id=None,
            )
            for definition in list_builtin_templates()
        ]
        custom = [
            self._build_template_read(template, is_builtin=False)
            for template in self.command_repository.list_machine_templates(machine_id)
        ]
        return builtins + custom

    def create_custom_template(
        self,
        *,
        machine_id: str,
        actor_user,
        payload: MachineCommandTemplateCreateRequest,
        client,
    ) -> MachineCommandTemplateRead:
        machine = self._require_machine(machine_id)
        access, ownership = self._require_access(machine_id=machine_id, actor_user_id=actor_user.id)
        ensure_can_manage_commands(
            actor_role=access.role,
            actor_is_creator_owner=ownership is not None and ownership.creator_user_id == actor_user.id,
        )
        ensure_runner_allowed_for_machine(os_family=machine.os_family, runner=payload.runner)
        ensure_command_pattern_safe(payload.command_pattern)
        parameters_schema = validate_parameter_definitions(payload.parameters)
        ensure_placeholders_match(payload.command_pattern, parameters_schema)

        template = self.command_repository.create_machine_template(
            machine_id=machine_id,
            template_key=generate_prefixed_id("cmd"),
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            runner=payload.runner,
            command_pattern=payload.command_pattern.strip(),
            parameters_schema=parameters_schema,
            parser_kind=payload.parser_kind,
            created_by_user_id=actor_user.id,
        )
        record_audit_event(
            self.command_repository,
            user_id=actor_user.id,
            action="commands.template_created",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": machine_id, "template_key": template.template_key},
        )
        self.command_repository.commit()
        return self._build_template_read(template, is_builtin=False)

    def update_custom_template(
        self,
        *,
        machine_id: str,
        template_id: str,
        actor_user,
        payload: MachineCommandTemplateUpdateRequest,
        client,
    ) -> MachineCommandTemplateRead:
        machine = self._require_machine(machine_id)
        access, ownership = self._require_access(machine_id=machine_id, actor_user_id=actor_user.id)
        ensure_can_manage_commands(
            actor_role=access.role,
            actor_is_creator_owner=ownership is not None and ownership.creator_user_id == actor_user.id,
        )
        template = self.command_repository.get_machine_template(template_id)
        if template is None or template.machine_id != machine_id:
            raise AppError("command_template_not_found", "Шаблон команды не найден.", 404)

        if payload.name is not None:
            template.name = payload.name.strip()
        if payload.description is not None:
            template.description = payload.description.strip() or None
        if payload.runner is not None:
            ensure_runner_allowed_for_machine(os_family=machine.os_family, runner=payload.runner)
            template.runner = payload.runner
        if payload.command_pattern is not None:
            ensure_command_pattern_safe(payload.command_pattern)
            template.command_pattern = payload.command_pattern.strip()
        if payload.parameters is not None:
            template.parameters_schema = validate_parameter_definitions(payload.parameters)
        if payload.parser_kind is not None:
            template.parser_kind = payload.parser_kind
        if payload.is_enabled is not None:
            template.is_enabled = payload.is_enabled

        ensure_placeholders_match(template.command_pattern, template.parameters_schema or [])
        self.command_repository.save(template)
        record_audit_event(
            self.command_repository,
            user_id=actor_user.id,
            action="commands.template_updated",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": machine_id, "template_key": template.template_key},
        )
        self.command_repository.commit()
        return self._build_template_read(template, is_builtin=False)

    def delete_custom_template(self, *, machine_id: str, template_id: str, actor_user, client) -> None:
        self._require_machine(machine_id)
        access, ownership = self._require_access(machine_id=machine_id, actor_user_id=actor_user.id)
        ensure_can_manage_commands(
            actor_role=access.role,
            actor_is_creator_owner=ownership is not None and ownership.creator_user_id == actor_user.id,
        )
        template = self.command_repository.get_machine_template(template_id)
        if template is None or template.machine_id != machine_id:
            raise AppError("command_template_not_found", "Шаблон команды не найден.", 404)
        template_key = template.template_key
        self.command_repository.delete_machine_template(template)
        record_audit_event(
            self.command_repository,
            user_id=actor_user.id,
            action="commands.template_deleted",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": machine_id, "template_key": template_key},
        )
        self.command_repository.commit()

    def reset_custom_templates(self, *, machine_id: str, actor_user, client) -> int:
        self._require_machine(machine_id)
        access, ownership = self._require_access(machine_id=machine_id, actor_user_id=actor_user.id)
        ensure_can_manage_commands(
            actor_role=access.role,
            actor_is_creator_owner=ownership is not None and ownership.creator_user_id == actor_user.id,
        )
        removed = 0
        for template in self.command_repository.list_machine_templates(machine_id):
            self.command_repository.delete_machine_template(template)
            removed += 1
        record_audit_event(
            self.command_repository,
            user_id=actor_user.id,
            action="commands.templates_reset",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"machine_id": machine_id, "removed_count": removed},
        )
        self.command_repository.commit()
        return removed

    def render_template_for_machine(
        self,
        *,
        machine_id: str,
        template_key: str,
        params: dict[str, str] | None,
    ) -> RenderedCommandRead:
        resolved = self.resolve_template_for_machine(machine_id=machine_id, template_key=template_key, params=params)
        return RenderedCommandRead(
            template_key=resolved.template_key,
            template_name=resolved.template_name,
            runner=resolved.runner,
            parser_kind=resolved.parser_kind,
            command=resolved.command,
            params=resolved.params,
            is_builtin=resolved.is_builtin,
        )

    def resolve_template_for_machine(
        self,
        *,
        machine_id: str,
        template_key: str,
        params: dict[str, str] | None,
    ) -> ResolvedTemplate:
        machine = self._require_machine(machine_id)
        builtin = get_builtin_template(template_key)
        if builtin is not None:
            normalized_params = normalize_param_values([], params)
            return ResolvedTemplate(
                template_key=builtin.template_key,
                template_name=builtin.name,
                runner=builtin.runner_for(machine.os_family),
                parser_kind=builtin.parser_kind,
                command=builtin.render(machine.os_family),
                params=normalized_params,
                is_builtin=True,
                task_kind=TaskKind.SYSTEM_TEMPLATE,
            )

        template = self.command_repository.get_machine_template_by_key(machine_id=machine_id, template_key=template_key)
        if template is None or not template.is_enabled:
            raise AppError("command_template_not_found", "Шаблон команды не найден.", 404)

        ensure_runner_allowed_for_machine(os_family=machine.os_family, runner=template.runner)
        normalized_params = normalize_param_values(template.parameters_schema or [], params)
        return ResolvedTemplate(
            template_key=template.template_key,
            template_name=template.name,
            runner=template.runner,
            parser_kind=template.parser_kind,
            command=render_command(template.command_pattern, normalized_params),
            params=normalized_params,
            is_builtin=False,
            task_kind=TaskKind.CUSTOM_TEMPLATE,
        )

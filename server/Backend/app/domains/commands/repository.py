from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.auth.models import AuditEvent
from app.domains.commands.models import MachineCommandTemplate


class CommandRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def save(self, entity) -> None:
        self.db.add(entity)
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def add_audit_event(
        self,
        *,
        user_id: str | None,
        action: str,
        status,
        ip_address: str | None,
        user_agent: str | None,
        details: dict | None = None,
    ) -> AuditEvent:
        event = AuditEvent(
            user_id=user_id,
            action=action,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
        self.db.add(event)
        self.db.flush()
        return event

    def create_machine_template(
        self,
        *,
        machine_id: str,
        template_key: str,
        name: str,
        description: str | None,
        runner,
        command_pattern: str,
        parameters_schema: list[dict] | None,
        parser_kind,
        created_by_user_id: str | None,
    ) -> MachineCommandTemplate:
        template = MachineCommandTemplate(
            machine_id=machine_id,
            template_key=template_key,
            name=name,
            description=description,
            runner=runner,
            command_pattern=command_pattern,
            parameters_schema=parameters_schema,
            parser_kind=parser_kind,
            created_by_user_id=created_by_user_id,
        )
        self.db.add(template)
        self.db.flush()
        return template

    def get_machine_template(self, template_id: str) -> MachineCommandTemplate | None:
        return self.db.get(MachineCommandTemplate, template_id)

    def get_machine_template_by_key(self, *, machine_id: str, template_key: str) -> MachineCommandTemplate | None:
        statement = select(MachineCommandTemplate).where(
            MachineCommandTemplate.machine_id == machine_id,
            MachineCommandTemplate.template_key == template_key,
        )
        return self.db.scalar(statement)

    def list_machine_templates(self, machine_id: str) -> list[MachineCommandTemplate]:
        statement = (
            select(MachineCommandTemplate)
            .where(MachineCommandTemplate.machine_id == machine_id)
            .order_by(MachineCommandTemplate.created_at.asc())
        )
        return list(self.db.scalars(statement).all())

    def delete_machine_template(self, template: MachineCommandTemplate) -> None:
        self.db.delete(template)
        self.db.flush()

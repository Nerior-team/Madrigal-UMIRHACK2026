from dataclasses import dataclass

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.domains.auth.models import AuditEvent
from app.domains.groups.models import MachineGroup, MachineGroupMember


@dataclass(slots=True)
class GroupListRow:
    group: MachineGroup
    machine_count: int


class GroupRepository:
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

    def create_group(self, *, owner_user_id: str, name: str, description: str | None) -> MachineGroup:
        group = MachineGroup(owner_user_id=owner_user_id, name=name, description=description)
        self.db.add(group)
        self.db.flush()
        return group

    def get_group(self, group_id: str) -> MachineGroup | None:
        return self.db.get(MachineGroup, group_id)

    def get_group_for_owner(self, *, group_id: str, owner_user_id: str) -> MachineGroup | None:
        statement = select(MachineGroup).where(MachineGroup.id == group_id, MachineGroup.owner_user_id == owner_user_id)
        return self.db.scalar(statement)

    def list_groups_for_owner(self, *, owner_user_id: str) -> list[GroupListRow]:
        statement = (
            select(MachineGroup, func.count(MachineGroupMember.id))
            .outerjoin(MachineGroupMember, MachineGroupMember.group_id == MachineGroup.id)
            .where(MachineGroup.owner_user_id == owner_user_id)
            .group_by(MachineGroup.id)
            .order_by(MachineGroup.created_at.desc())
        )
        return [GroupListRow(group=group, machine_count=int(machine_count or 0)) for group, machine_count in self.db.execute(statement).all()]

    def delete_group(self, group_id: str) -> None:
        self.db.execute(delete(MachineGroup).where(MachineGroup.id == group_id))
        self.db.flush()

    def get_member(self, *, group_id: str, machine_id: str) -> MachineGroupMember | None:
        statement = select(MachineGroupMember).where(
            MachineGroupMember.group_id == group_id,
            MachineGroupMember.machine_id == machine_id,
        )
        return self.db.scalar(statement)

    def add_member(self, *, group_id: str, machine_id: str, added_by_user_id: str | None) -> MachineGroupMember:
        member = MachineGroupMember(group_id=group_id, machine_id=machine_id, added_by_user_id=added_by_user_id)
        self.db.add(member)
        self.db.flush()
        return member

    def delete_member(self, *, group_id: str, machine_id: str) -> None:
        self.db.execute(
            delete(MachineGroupMember).where(
                MachineGroupMember.group_id == group_id,
                MachineGroupMember.machine_id == machine_id,
            )
        )
        self.db.flush()

    def list_group_members(self, *, group_id: str) -> list[MachineGroupMember]:
        statement = select(MachineGroupMember).where(MachineGroupMember.group_id == group_id).order_by(
            MachineGroupMember.created_at.asc()
        )
        return list(self.db.scalars(statement).all())

    def list_group_machine_ids(self, *, group_id: str) -> list[str]:
        statement = select(MachineGroupMember.machine_id).where(MachineGroupMember.group_id == group_id)
        return list(self.db.scalars(statement).all())


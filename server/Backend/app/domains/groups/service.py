from app.core.config import get_settings
from app.core.exceptions import AppError
from app.domains.access.repository import AccessRepository
from app.domains.access.roles import ensure_can_view_machine
from app.domains.groups.repository import GroupRepository
from app.domains.groups.schemas import (
    GroupActionResponse,
    GroupCreateRequest,
    GroupDetailRead,
    GroupMemberRead,
    GroupRead,
    GroupUpdateRequest,
)
from app.domains.machines.repository import MachineRepository
from app.domains.machines.schemas import MachineSummary
from app.domains.machines.status import resolve_machine_status
from app.infra.observability.audit import record_audit_event
from app.shared.enums import AuditStatus
from app.shared.time import utc_now


class GroupService:
    def __init__(
        self,
        *,
        group_repository: GroupRepository,
        access_repository: AccessRepository,
        machine_repository: MachineRepository,
    ) -> None:
        self.group_repository = group_repository
        self.access_repository = access_repository
        self.machine_repository = machine_repository
        self.settings = get_settings()

    def _require_group_owner(self, *, group_id: str, actor_user_id: str):
        group = self.group_repository.get_group_for_owner(group_id=group_id, owner_user_id=actor_user_id)
        if group is None:
            raise AppError("group_not_found", "Группа не найдена.", 404)
        return group

    def _build_machine_summary(self, *, machine_id: str, actor_user_id: str) -> MachineSummary:
        rows = self.machine_repository.list_for_user(actor_user_id)
        for row in rows:
            if row.machine.id == machine_id:
                return MachineSummary(
                    id=row.machine.id,
                    display_name=row.machine.display_name,
                    hostname=row.machine.hostname,
                    os_family=row.machine.os_family,
                    os_version=row.machine.os_version,
                    status=resolve_machine_status(
                        stored_status=row.machine.status,
                        last_heartbeat_at=row.machine.last_heartbeat_at,
                        now=utc_now(),
                        stale_minutes=self.settings.machine_heartbeat_stale_minutes,
                    ),
                    last_heartbeat_at=row.machine.last_heartbeat_at,
                    unpaired_at=row.unpaired_at,
                    owner_email=row.owner_email,
                    my_role=row.my_role,
                )
        raise AppError("machine_not_found", "Машина не найдена.", 404)

    def _require_creator_owner(self, *, machine_id: str, actor_user_id: str) -> None:
        machine = self.machine_repository.get_machine(machine_id)
        if machine is None:
            raise AppError("machine_not_found", "Машина не найдена.", 404)
        access = self.access_repository.get_access(machine_id, actor_user_id)
        if access is None or access.revoked_at is not None:
            raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)
        ensure_can_view_machine(access.role)
        ownership = self.access_repository.get_ownership(machine_id)
        if ownership is None or ownership.creator_user_id != actor_user_id:
            raise AppError("group_machine_forbidden", "Добавлять в группу можно только свои машины.", 403)

    def _build_group_read(self, group, machine_count: int) -> GroupRead:
        return GroupRead(
            id=group.id,
            owner_user_id=group.owner_user_id,
            name=group.name,
            description=group.description,
            machine_count=machine_count,
            created_at=group.created_at,
            updated_at=group.updated_at,
        )

    def _build_group_detail(self, *, group, actor_user_id: str) -> GroupDetailRead:
        members = self.group_repository.list_group_members(group_id=group.id)
        return GroupDetailRead(
            id=group.id,
            owner_user_id=group.owner_user_id,
            name=group.name,
            description=group.description,
            created_at=group.created_at,
            updated_at=group.updated_at,
            machines=[
                GroupMemberRead(
                    machine_id=member.machine_id,
                    added_by_user_id=member.added_by_user_id,
                    created_at=member.created_at,
                    machine=self._build_machine_summary(machine_id=member.machine_id, actor_user_id=actor_user_id),
                )
                for member in members
            ],
        )

    def list_groups(self, *, actor_user_id: str) -> list[GroupRead]:
        rows = self.group_repository.list_groups_for_owner(owner_user_id=actor_user_id)
        return [self._build_group_read(item.group, item.machine_count) for item in rows]

    def create_group(self, *, actor_user, payload: GroupCreateRequest, client) -> GroupRead:
        group = self.group_repository.create_group(
            owner_user_id=actor_user.id,
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
        )
        record_audit_event(
            self.group_repository,
            user_id=actor_user.id,
            action="groups.created",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"group_id": group.id, "name": group.name},
        )
        self.group_repository.commit()
        return self._build_group_read(group, 0)

    def get_group(self, *, actor_user_id: str, group_id: str) -> GroupDetailRead:
        group = self._require_group_owner(group_id=group_id, actor_user_id=actor_user_id)
        return self._build_group_detail(group=group, actor_user_id=actor_user_id)

    def update_group(self, *, actor_user, group_id: str, payload: GroupUpdateRequest, client) -> GroupRead:
        group = self._require_group_owner(group_id=group_id, actor_user_id=actor_user.id)
        if payload.name is not None:
            group.name = payload.name.strip()
        if payload.description is not None:
            group.description = payload.description.strip() or None
        self.group_repository.save(group)
        record_audit_event(
            self.group_repository,
            user_id=actor_user.id,
            action="groups.updated",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"group_id": group.id},
        )
        self.group_repository.commit()
        machine_count = len(self.group_repository.list_group_machine_ids(group_id=group.id))
        return self._build_group_read(group, machine_count)

    def delete_group(self, *, actor_user, group_id: str, client) -> GroupActionResponse:
        group = self._require_group_owner(group_id=group_id, actor_user_id=actor_user.id)
        self.group_repository.delete_group(group_id=group.id)
        record_audit_event(
            self.group_repository,
            user_id=actor_user.id,
            action="groups.deleted",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"group_id": group.id},
        )
        self.group_repository.commit()
        return GroupActionResponse(message="Group deleted")

    def add_machine(self, *, actor_user, group_id: str, machine_id: str, client) -> GroupDetailRead:
        group = self._require_group_owner(group_id=group_id, actor_user_id=actor_user.id)
        self._require_creator_owner(machine_id=machine_id, actor_user_id=actor_user.id)
        if self.group_repository.get_member(group_id=group.id, machine_id=machine_id) is not None:
            raise AppError("group_member_exists", "Машина уже входит в группу.", 400)
        self.group_repository.add_member(group_id=group.id, machine_id=machine_id, added_by_user_id=actor_user.id)
        record_audit_event(
            self.group_repository,
            user_id=actor_user.id,
            action="groups.machine_added",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"group_id": group.id, "machine_id": machine_id},
        )
        self.group_repository.commit()
        return self._build_group_detail(group=group, actor_user_id=actor_user.id)

    def remove_machine(self, *, actor_user, group_id: str, machine_id: str, client) -> GroupActionResponse:
        group = self._require_group_owner(group_id=group_id, actor_user_id=actor_user.id)
        if self.group_repository.get_member(group_id=group.id, machine_id=machine_id) is None:
            raise AppError("group_member_not_found", "Машина не состоит в группе.", 404)
        self.group_repository.delete_member(group_id=group.id, machine_id=machine_id)
        record_audit_event(
            self.group_repository,
            user_id=actor_user.id,
            action="groups.machine_removed",
            status=AuditStatus.SUCCESS,
            ip_address=client.ip_address,
            user_agent=client.user_agent,
            details={"group_id": group.id, "machine_id": machine_id},
        )
        self.group_repository.commit()
        return GroupActionResponse(message="Machine removed from group")

    def resolve_group_machine_ids(self, *, actor_user_id: str, group_id: str) -> list[str]:
        group = self._require_group_owner(group_id=group_id, actor_user_id=actor_user_id)
        return self.group_repository.list_group_machine_ids(group_id=group.id)

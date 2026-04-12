from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.access.models import MachineAccess, MachineOwnership
from app.domains.auth.models import AuditEvent
from app.domains.machines.models import Machine, MachineHeartbeat, MachineRegistration
from app.domains.profile.models import UserProfile
from app.domains.users.models import User
from app.shared.enums import DeletedMachineRetention, MachineAccessRole
from app.shared.time import utc_now


@dataclass(slots=True)
class MachineListRow:
    machine: Machine
    my_role: MachineAccessRole
    owner_email: str
    creator_user_id: str
    unpaired_at: datetime | None


class MachineRepository:
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

    def create_registration(
        self,
        *,
        device_code: str,
        registration_token_hash: str,
        pending_display_name: str | None,
        pending_hostname: str,
        pending_os_family,
        pending_os_version: str | None,
        pending_agent_version: str | None,
        expires_at: datetime,
    ) -> MachineRegistration:
        registration = MachineRegistration(
            device_code=device_code,
            registration_token_hash=registration_token_hash,
            pending_display_name=pending_display_name,
            pending_hostname=pending_hostname,
            pending_os_family=pending_os_family,
            pending_os_version=pending_os_version,
            pending_agent_version=pending_agent_version,
            expires_at=expires_at,
        )
        self.db.add(registration)
        self.db.flush()
        return registration

    def get_registration(self, registration_id: str) -> MachineRegistration | None:
        return self.db.get(MachineRegistration, registration_id)

    def get_registration_by_device_code(self, device_code: str) -> MachineRegistration | None:
        return self.db.scalar(select(MachineRegistration).where(MachineRegistration.device_code == device_code))

    def create_machine(
        self,
        *,
        display_name: str,
        hostname: str,
        os_family,
        os_version: str | None,
        machine_token_hash: str,
    ) -> Machine:
        machine = Machine(
            display_name=display_name,
            hostname=hostname,
            os_family=os_family,
            os_version=os_version,
            machine_token_hash=machine_token_hash,
        )
        self.db.add(machine)
        self.db.flush()
        return machine

    def get_machine(self, machine_id: str) -> Machine | None:
        return self.db.get(Machine, machine_id)

    def get_machine_by_token_hash(self, machine_token_hash: str) -> Machine | None:
        return self.db.scalar(select(Machine).where(Machine.machine_token_hash == machine_token_hash))

    def get_heartbeat(self, machine_id: str) -> MachineHeartbeat | None:
        return self.db.get(MachineHeartbeat, machine_id)

    def _resolve_unpaired_lookup(self, machine_ids: set[str]) -> dict[str, datetime]:
        if not machine_ids:
            return {}
        events = self.db.scalars(
            select(AuditEvent)
            .where(AuditEvent.action == "machine.unpaired")
            .order_by(AuditEvent.created_at.desc())
        ).all()
        lookup: dict[str, datetime] = {}
        for event in events:
            details = event.details or {}
            machine_id = details.get("machine_id")
            if machine_id in machine_ids and machine_id not in lookup:
                lookup[machine_id] = event.created_at
        return lookup

    def get_deleted_machine_retention(self, user_id: str) -> DeletedMachineRetention:
        profile = self.db.get(UserProfile, user_id)
        if profile is None:
            return DeletedMachineRetention.MONTH
        return profile.deleted_machine_retention

    def _is_machine_visible(
        self,
        *,
        unpaired_at: datetime | None,
        retention: DeletedMachineRetention,
        now: datetime,
    ) -> bool:
        if unpaired_at is None:
            return True
        if retention == DeletedMachineRetention.NONE:
            return False
        if retention == DeletedMachineRetention.FOREVER:
            return True

        retention_windows = {
            DeletedMachineRetention.WEEK: timedelta(weeks=1),
            DeletedMachineRetention.MONTH: timedelta(days=30),
            DeletedMachineRetention.THREE_MONTHS: timedelta(days=90),
            DeletedMachineRetention.SIX_MONTHS: timedelta(days=180),
            DeletedMachineRetention.YEAR: timedelta(days=365),
        }
        ttl = retention_windows.get(retention)
        if ttl is None:
            return True
        return now - unpaired_at <= ttl

    def list_for_user(
        self,
        user_id: str,
        *,
        retention: DeletedMachineRetention = DeletedMachineRetention.MONTH,
    ) -> list[MachineListRow]:
        statement = (
            select(Machine, MachineAccess.role, User.email, MachineOwnership.creator_user_id)
            .join(MachineAccess, MachineAccess.machine_id == Machine.id)
            .join(MachineOwnership, MachineOwnership.machine_id == Machine.id)
            .join(User, User.id == MachineOwnership.creator_user_id)
            .where(MachineAccess.user_id == user_id, MachineAccess.revoked_at.is_(None))
            .order_by(Machine.created_at.desc())
        )
        rows = self.db.execute(statement).all()
        machine_ids = {machine.id for machine, *_ in rows}
        unpaired_lookup = self._resolve_unpaired_lookup(machine_ids)
        now = utc_now()
        return [
            MachineListRow(
                machine=machine,
                my_role=my_role,
                owner_email=owner_email,
                creator_user_id=creator_user_id,
                unpaired_at=unpaired_lookup.get(machine.id),
            )
            for machine, my_role, owner_email, creator_user_id in rows
            if self._is_machine_visible(
                unpaired_at=unpaired_lookup.get(machine.id),
                retention=retention,
                now=now,
            )
        ]

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.access.models import MachineAccess, MachineOwnership
from app.domains.auth.models import AuditEvent
from app.domains.machines.models import Machine, MachineHeartbeat, MachineRegistration
from app.domains.users.models import User
from app.shared.enums import MachineAccessRole


@dataclass(slots=True)
class MachineListRow:
    machine: Machine
    my_role: MachineAccessRole
    owner_email: str
    creator_user_id: str


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

    def list_for_user(self, user_id: str) -> list[MachineListRow]:
        statement = (
            select(Machine, MachineAccess.role, User.email, MachineOwnership.creator_user_id)
            .join(MachineAccess, MachineAccess.machine_id == Machine.id)
            .join(MachineOwnership, MachineOwnership.machine_id == Machine.id)
            .join(User, User.id == MachineOwnership.creator_user_id)
            .where(MachineAccess.user_id == user_id, MachineAccess.revoked_at.is_(None))
            .order_by(Machine.created_at.desc())
        )
        rows = self.db.execute(statement).all()
        return [
            MachineListRow(
                machine=machine,
                my_role=my_role,
                owner_email=owner_email,
                creator_user_id=creator_user_id,
            )
            for machine, my_role, owner_email, creator_user_id in rows
        ]

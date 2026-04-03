from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.access.models import MachineAccess, MachineInvite, MachineOwnership
from app.domains.auth.models import AuditEvent
from app.domains.users.models import User


class AccessRepository:
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

    def create_ownership(self, *, machine_id: str, creator_user_id: str) -> MachineOwnership:
        ownership = MachineOwnership(machine_id=machine_id, creator_user_id=creator_user_id)
        self.db.add(ownership)
        self.db.flush()
        return ownership

    def get_ownership(self, machine_id: str) -> MachineOwnership | None:
        return self.db.scalar(select(MachineOwnership).where(MachineOwnership.machine_id == machine_id))

    def get_access(self, machine_id: str, user_id: str) -> MachineAccess | None:
        return self.db.scalar(select(MachineAccess).where(MachineAccess.machine_id == machine_id, MachineAccess.user_id == user_id))

    def get_access_by_id(self, access_id: str) -> MachineAccess | None:
        return self.db.get(MachineAccess, access_id)

    def get_user_by_id(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def upsert_access(
        self,
        *,
        machine_id: str,
        user_id: str,
        role,
        granted_by_user_id: str | None,
    ) -> MachineAccess:
        access = self.get_access(machine_id, user_id)
        if access is None:
            access = MachineAccess(
                machine_id=machine_id,
                user_id=user_id,
                role=role,
                granted_by_user_id=granted_by_user_id,
            )
            self.db.add(access)
            self.db.flush()
            return access
        access.role = role
        access.granted_by_user_id = granted_by_user_id
        access.revoked_at = None
        self.db.add(access)
        self.db.flush()
        return access

    def list_access_entries(self, machine_id: str) -> list[tuple[MachineAccess, str, str | None]]:
        statement = (
            select(MachineAccess, User.email, MachineOwnership.creator_user_id)
            .join(User, User.id == MachineAccess.user_id)
            .join(MachineOwnership, MachineOwnership.machine_id == MachineAccess.machine_id)
            .where(MachineAccess.machine_id == machine_id)
            .order_by(MachineAccess.created_at.asc())
        )
        return self.db.execute(statement).all()

    def get_owner_email(self, machine_id: str) -> str | None:
        statement = (
            select(User.email)
            .join(MachineOwnership, MachineOwnership.creator_user_id == User.id)
            .where(MachineOwnership.machine_id == machine_id)
        )
        return self.db.scalar(statement)

    def create_invite(
        self,
        *,
        machine_id: str,
        email: str,
        role,
        invite_token_hash: str,
        invited_by_user_id: str,
        expires_at,
    ) -> MachineInvite:
        invite = MachineInvite(
            machine_id=machine_id,
            email=email,
            role=role,
            invite_token_hash=invite_token_hash,
            invited_by_user_id=invited_by_user_id,
            expires_at=expires_at,
        )
        self.db.add(invite)
        self.db.flush()
        return invite

    def get_invite_by_hash(self, invite_token_hash: str) -> MachineInvite | None:
        return self.db.scalar(select(MachineInvite).where(MachineInvite.invite_token_hash == invite_token_hash))

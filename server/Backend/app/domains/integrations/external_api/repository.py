from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.auth.models import AuditEvent
from app.domains.integrations.external_api.models import ApiAccessKey, ApiAccessKeyMachineScope, ApiAccessKeyTemplateScope


class ExternalApiRepository:
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

    def create_api_key(
        self,
        *,
        public_id: str,
        owner_user_id: str,
        name: str,
        token_hash: str,
        permission,
        usage_limit: int | None,
        expires_at,
    ) -> ApiAccessKey:
        key = ApiAccessKey(
            public_id=public_id,
            owner_user_id=owner_user_id,
            name=name,
            token_hash=token_hash,
            permission=permission,
            usage_limit=usage_limit,
            expires_at=expires_at,
        )
        self.db.add(key)
        self.db.flush()
        return key

    def add_machine_scope(self, *, api_key_id: str, machine_id: str) -> ApiAccessKeyMachineScope:
        scope = ApiAccessKeyMachineScope(api_key_id=api_key_id, machine_id=machine_id)
        self.db.add(scope)
        self.db.flush()
        return scope

    def add_template_scope(self, *, api_key_id: str, template_key: str) -> ApiAccessKeyTemplateScope:
        scope = ApiAccessKeyTemplateScope(api_key_id=api_key_id, template_key=template_key)
        self.db.add(scope)
        self.db.flush()
        return scope

    def list_api_keys_for_user(self, owner_user_id: str) -> list[ApiAccessKey]:
        statement = (
            select(ApiAccessKey)
            .where(ApiAccessKey.owner_user_id == owner_user_id)
            .order_by(ApiAccessKey.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_api_key_for_user(self, *, key_id: str, owner_user_id: str) -> ApiAccessKey | None:
        return self.db.scalar(
            select(ApiAccessKey).where(ApiAccessKey.id == key_id, ApiAccessKey.owner_user_id == owner_user_id)
        )

    def get_api_key_by_public_id(self, public_id: str) -> ApiAccessKey | None:
        return self.db.scalar(select(ApiAccessKey).where(ApiAccessKey.public_id == public_id))

    def list_machine_scopes(self, api_key_id: str) -> list[str]:
        statement = select(ApiAccessKeyMachineScope.machine_id).where(ApiAccessKeyMachineScope.api_key_id == api_key_id)
        return list(self.db.scalars(statement).all())

    def list_template_scopes(self, api_key_id: str) -> list[str]:
        statement = select(ApiAccessKeyTemplateScope.template_key).where(
            ApiAccessKeyTemplateScope.api_key_id == api_key_id
        )
        return list(self.db.scalars(statement).all())

from app.domains.auth.repository import AuthRepository
from app.shared.enums import AuditStatus


def record_audit_event(
    repository: AuthRepository,
    *,
    user_id: str | None,
    action: str,
    status: AuditStatus,
    ip_address: str | None,
    user_agent: str | None,
    details: dict | None = None,
) -> None:
    repository.add_audit_event(
        user_id=user_id,
        action=action,
        status=status,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details,
    )

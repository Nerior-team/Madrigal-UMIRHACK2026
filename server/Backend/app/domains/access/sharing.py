from app.core.exceptions import AppError
from app.shared.enums import MachineInviteStatus
from app.shared.time import has_expired


def ensure_invite_is_active(invite) -> None:
    if invite.status != MachineInviteStatus.PENDING:
        raise AppError("invite_unavailable", "Приглашение больше недоступно.", 400)
    if has_expired(invite.expires_at):
        invite.status = MachineInviteStatus.EXPIRED
        raise AppError("invite_expired", "Срок действия приглашения истёк.", 400)

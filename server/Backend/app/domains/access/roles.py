from app.core.exceptions import AppError
from app.shared.enums import MachineAccessRole

ROLE_RANK: dict[MachineAccessRole, int] = {
    MachineAccessRole.VIEWER: 1,
    MachineAccessRole.OPERATOR: 2,
    MachineAccessRole.ADMIN: 3,
    MachineAccessRole.OWNER: 4,
}


def ensure_can_view_machine(actor_role: MachineAccessRole | None) -> None:
    if actor_role is None:
        raise AppError("machine_access_denied", "Доступ к машине запрещён.", 403)


def ensure_can_manage_access(
    *,
    actor_role: MachineAccessRole | None,
    actor_is_creator_owner: bool,
    target_role: MachineAccessRole | None = None,
    target_is_creator_owner: bool = False,
) -> None:
    if actor_role not in {MachineAccessRole.OWNER, MachineAccessRole.ADMIN}:
        raise AppError("machine_access_denied", "Недостаточно прав для управления доступом.", 403)
    if target_is_creator_owner:
        raise AppError("creator_owner_protected", "Создателя машины нельзя изменить или удалить.", 403)
    if target_role is None:
        return
    if actor_role == MachineAccessRole.ADMIN and target_role in {MachineAccessRole.ADMIN, MachineAccessRole.OWNER}:
        raise AppError("machine_access_denied", "Администратор не может управлять владельцами и администраторами.", 403)
    if actor_role == MachineAccessRole.OWNER and not actor_is_creator_owner and target_role == MachineAccessRole.OWNER:
        raise AppError("machine_access_denied", "Только создатель машины может управлять владельцами.", 403)


def ensure_can_grant_role(
    *,
    actor_role: MachineAccessRole | None,
    actor_is_creator_owner: bool,
    requested_role: MachineAccessRole,
) -> None:
    if actor_role not in {MachineAccessRole.OWNER, MachineAccessRole.ADMIN}:
        raise AppError("machine_access_denied", "Недостаточно прав для назначения доступа.", 403)
    if requested_role == MachineAccessRole.OWNER and not actor_is_creator_owner:
        raise AppError("machine_access_denied", "Только создатель машины может назначать владельца.", 403)
    if actor_role == MachineAccessRole.ADMIN and requested_role in {MachineAccessRole.ADMIN, MachineAccessRole.OWNER}:
        raise AppError("machine_access_denied", "Администратор может выдавать только operator и viewer.", 403)

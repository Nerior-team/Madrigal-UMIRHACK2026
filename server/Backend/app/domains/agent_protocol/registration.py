from app.core.exceptions import AppError


def parse_machine_bearer_token(authorization: str | None) -> str:
    if authorization is None or not authorization.startswith("Bearer "):
        raise AppError("machine_unauthorized", "Требуется machine token.", 401)

    machine_token = authorization.removeprefix("Bearer ").strip()
    if not machine_token:
        raise AppError("machine_unauthorized", "Требуется machine token.", 401)

    return machine_token

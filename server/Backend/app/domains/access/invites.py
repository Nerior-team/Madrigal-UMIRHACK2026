from app.core.config import get_settings
from app.infra.email.templates import build_machine_invite_email


def build_invite_link(raw_token: str) -> str:
    return f"{get_settings().public_web_base_url.rstrip('/')}/invites/{raw_token}"


def build_invite_message(*, raw_token: str, machine_display_name: str, email: str, role: str):
    return build_machine_invite_email(
        invite_link=build_invite_link(raw_token),
        machine_display_name=machine_display_name,
        email=email,
        role=role,
    )

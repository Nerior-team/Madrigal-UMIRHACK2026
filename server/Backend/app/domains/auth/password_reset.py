from app.core.config import get_settings
from app.core.security import generate_session_token, hash_token, password_reset_ttl
from app.infra.email.client import MailTransport
from app.infra.email.templates import build_password_reset_email
from app.shared.time import utc_now


def issue_password_reset(*, repository, mailer: MailTransport, user) -> str:
    raw_token = generate_session_token()
    repository.create_password_reset(
        user_id=user.id,
        token_hash=hash_token(raw_token, purpose="password_reset"),
        expires_at=utc_now() + password_reset_ttl(),
    )
    reset_link = f"{get_settings().public_web_base_url.rstrip('/')}/password/reset/{raw_token}"
    subject, html_body, text_body = build_password_reset_email(reset_link=reset_link, email=user.email)
    mailer.send(to_email=user.email, subject=subject, html_body=html_body, text_body=text_body)
    return raw_token

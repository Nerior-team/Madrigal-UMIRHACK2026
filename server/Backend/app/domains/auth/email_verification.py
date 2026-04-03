from app.core.security import email_code_ttl, generate_numeric_code, hash_token
from app.infra.email.client import MailTransport
from app.infra.email.templates import build_verification_email
from app.shared.time import utc_now


def issue_email_verification(*, repository, mailer: MailTransport, user, max_attempts: int) -> str:
    raw_code = generate_numeric_code(6)
    code_hash = hash_token(raw_code, purpose="email_verification")
    repository.create_email_verification(
        user_id=user.id,
        code_hash=code_hash,
        code_last4=raw_code[-4:],
        expires_at=utc_now() + email_code_ttl(),
        max_attempts=max_attempts,
    )
    subject, html_body, text_body = build_verification_email(code=raw_code, email=user.email)
    mailer.send(to_email=user.email, subject=subject, html_body=html_body, text_body=text_body)
    return raw_code

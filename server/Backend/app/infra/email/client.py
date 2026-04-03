import smtplib
from email.message import EmailMessage
from typing import Protocol

from app.core.config import Settings, get_settings


class MailTransport(Protocol):
    def send(self, *, to_email: str, subject: str, html_body: str, text_body: str) -> None: ...


class NullMailTransport:
    def send(self, *, to_email: str, subject: str, html_body: str, text_body: str) -> None:
        return None


class SmtpMailTransport:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def send(self, *, to_email: str, subject: str, html_body: str, text_body: str) -> None:
        message = EmailMessage()
        message["From"] = self.settings.email_from
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(text_body)
        message.add_alternative(html_body, subtype="html")

        with smtplib.SMTP_SSL(self.settings.smtp_host, self.settings.smtp_port) as smtp:
            smtp.login(self.settings.smtp_user, self.settings.smtp_pass)
            smtp.send_message(message)


def get_mail_transport() -> MailTransport:
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_user or settings.smtp_pass == "replace-with-app-password":
        return NullMailTransport()
    return SmtpMailTransport(settings)

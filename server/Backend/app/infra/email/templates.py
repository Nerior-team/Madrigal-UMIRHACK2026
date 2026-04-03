from app.core.config import get_settings


def build_verification_email(*, code: str, email: str) -> tuple[str, str, str]:
    settings = get_settings()
    subject = f"Подтверждение регистрации — {settings.brand_display_name}"
    text_body = (
        f"Здравствуйте.\n\n"
        f"Ваш код подтверждения для {settings.brand_display_name}: {code}\n\n"
        f"Если вы не регистрировались, просто проигнорируйте это письмо.\n"
    )
    html_body = (
        "<html><body style='font-family:Arial,sans-serif;background:#0b1020;color:#f5f7fa;padding:24px;'>"
        f"<h2 style='margin:0 0 16px 0;'>{settings.brand_display_name}</h2>"
        f"<p>Здравствуйте. Мы получили запрос на регистрацию для <b>{email}</b>.</p>"
        f"<p>Код подтверждения:</p><div style='font-size:28px;font-weight:700;letter-spacing:6px;'>{code}</div>"
        "<p style='margin-top:20px;'>Если это были не вы, просто проигнорируйте письмо.</p>"
        "</body></html>"
    )
    return subject, html_body, text_body


def build_password_reset_email(*, reset_link: str, email: str) -> tuple[str, str, str]:
    settings = get_settings()
    subject = f"Сброс пароля — {settings.brand_display_name}"
    text_body = (
        f"Здравствуйте.\n\n"
        f"Для аккаунта {email} был запрошен сброс пароля.\n"
        f"Перейдите по ссылке: {reset_link}\n\n"
        f"Если запрос делали не вы, смена не требуется.\n"
    )
    html_body = (
        "<html><body style='font-family:Arial,sans-serif;background:#0b1020;color:#f5f7fa;padding:24px;'>"
        f"<h2 style='margin:0 0 16px 0;'>{settings.brand_display_name}</h2>"
        f"<p>Для аккаунта <b>{email}</b> был запрошен сброс пароля.</p>"
        f"<p><a href='{reset_link}' style='color:#7dd3fc;'>Открыть страницу сброса пароля</a></p>"
        "<p style='margin-top:20px;'>Если это были не вы, просто проигнорируйте письмо.</p>"
        "</body></html>"
    )
    return subject, html_body, text_body


def build_machine_invite_email(
    *,
    invite_link: str,
    machine_display_name: str,
    email: str,
    role: str,
) -> tuple[str, str, str]:
    subject = f"{get_settings().brand_display_name}: приглашение к машине"
    html_body = f"""
    <html>
      <body>
        <h2>Приглашение к машине в {get_settings().brand_display_name}</h2>
        <p>Для email <strong>{email}</strong> создан доступ к машине <strong>{machine_display_name}</strong>.</p>
        <p>Роль: <strong>{role}</strong>.</p>
        <p><a href="{invite_link}">Принять приглашение</a></p>
      </body>
    </html>
    """.strip()
    text_body = (
        f"Для {email} создан доступ к машине {machine_display_name}.\n"
        f"Роль: {role}.\n"
        f"Принять приглашение: {invite_link}"
    )
    return subject, html_body, text_body

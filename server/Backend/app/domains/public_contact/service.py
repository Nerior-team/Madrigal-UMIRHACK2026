from html import escape

from app.core.config import get_settings
from app.domains.public_contact.schemas import PublicContactRequest, PublicContactResponse
from app.infra.email.client import get_mail_transport


INTEREST_LABELS = {
    "crossplat": "Crossplat",
    "smart-planner": "Smart-Planner",
    "karpik": "Karpik",
    "other": "Другое",
}

MODE_LABELS = {
    "client": "Клиент",
    "business": "Бизнес",
}


class PublicContactService:
    def submit(self, payload: PublicContactRequest) -> PublicContactResponse:
        settings = get_settings()
        recipient = settings.effective_contact_form_recipient_email
        interest_label = INTEREST_LABELS[payload.interest]
        mode_label = MODE_LABELS[payload.mode]

        transport = get_mail_transport()
        transport.send(
            to_email=recipient,
            subject=f"[Nerior] Новый запрос: {mode_label} / {interest_label}",
            html_body=self._build_html(payload, interest_label, mode_label),
            text_body=self._build_text(payload, interest_label, mode_label),
        )

        return PublicContactResponse(
            status="ok",
            detail="Запрос отправлен. Мы свяжемся с вами после обработки.",
        )

    def _build_html(
        self,
        payload: PublicContactRequest,
        interest_label: str,
        mode_label: str,
    ) -> str:
        rows = [
            ("Тип обращения", mode_label),
            ("Что интересует", interest_label),
            ("Имя", payload.first_name),
            ("Фамилия", payload.last_name),
            ("Email", payload.email),
            ("Телефон", payload.phone),
            ("Маркетинг", "Да" if payload.marketing else "Нет"),
        ]
        if payload.mode == "business":
            rows.extend(
                [
                    ("Компания", payload.company_name or "—"),
                    ("Размер компании", payload.company_size or "—"),
                ]
            )

        rows_html = "".join(
            f"""
            <tr>
              <td style="padding:12px 0;color:#666;font-size:12px;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #ece7da;">{escape(label)}</td>
              <td style="padding:12px 0;color:#111;font-size:15px;border-bottom:1px solid #ece7da;">{escape(value)}</td>
            </tr>
            """
            for label, value in rows
        )

        return f"""
        <html>
          <body style="margin:0;padding:32px;background:#f4f0e8;font-family:Arial,sans-serif;color:#111;">
            <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:28px;padding:32px 36px;border:1px solid #e5dece;">
              <div style="margin-bottom:28px;">
                <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#716b62;margin-bottom:10px;">Nerior Contact</div>
                <h1 style="margin:0;font-size:32px;line-height:1.05;">Новый запрос с публичного сайта</h1>
              </div>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                {rows_html}
              </table>
              <div style="border-radius:22px;background:#0c0c0c;padding:24px;color:#f8f4ec;">
                <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#bdb5a7;margin-bottom:12px;">Сообщение</div>
                <div style="font-size:15px;line-height:1.75;white-space:pre-wrap;">{escape(payload.message)}</div>
              </div>
            </div>
          </body>
        </html>
        """

    def _build_text(
        self,
        payload: PublicContactRequest,
        interest_label: str,
        mode_label: str,
    ) -> str:
        lines = [
            "Новый запрос с публичного сайта Nerior",
            "",
            f"Тип обращения: {mode_label}",
            f"Что интересует: {interest_label}",
            f"Имя: {payload.first_name}",
            f"Фамилия: {payload.last_name}",
            f"Email: {payload.email}",
            f"Телефон: {payload.phone}",
            f"Маркетинг: {'Да' if payload.marketing else 'Нет'}",
        ]
        if payload.mode == "business":
            lines.extend(
                [
                    f"Компания: {payload.company_name or '—'}",
                    f"Размер компании: {payload.company_size or '—'}",
                ]
            )
        lines.extend(["", "Сообщение:", payload.message])
        return "\n".join(lines)

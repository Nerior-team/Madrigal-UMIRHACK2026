from app.core.exceptions import AppError
from app.domains.auth.schemas import TelegramSetupStartResponse


def start_telegram_setup() -> TelegramSetupStartResponse:
    return TelegramSetupStartResponse(
        supported=False,
        reason="Telegram 2FA будет подключена вместе с bot-модулем.",
    )


def confirm_telegram_setup() -> None:
    raise AppError("telegram_2fa_unavailable", "Telegram 2FA будет подключена вместе с bot-модулем.", 501)


def disable_telegram_setup() -> None:
    raise AppError("telegram_2fa_unavailable", "Telegram 2FA будет подключена вместе с bot-модулем.", 501)

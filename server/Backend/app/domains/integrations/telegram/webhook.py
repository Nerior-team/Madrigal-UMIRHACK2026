from app.core.config import get_settings


def build_telegram_deep_link(raw_token: str) -> str:
    username = get_settings().telegram_bot_username.strip().lstrip("@")
    return f"https://t.me/{username}?start=link_{raw_token}"

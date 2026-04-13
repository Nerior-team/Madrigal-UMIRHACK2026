from dataclasses import dataclass

from fastapi import Request


@dataclass(frozen=True, slots=True)
class WebAppConfig:
    key: str
    cookie_name: str
    csrf_cookie_name: str


def _normalize_host(request: Request) -> str:
    return request.headers.get("host", "").split(":", 1)[0].strip().lower()


def resolve_web_app(request: Request) -> str:
    hostname = _normalize_host(request)
    if hostname.startswith("api.") or hostname.startswith("platform."):
        return "api"
    return "crossplat"


def resolve_web_app_config(request: Request) -> WebAppConfig:
    from app.core.config import get_settings

    settings = get_settings()
    if resolve_web_app(request) == "api":
        return WebAppConfig(
            key="api",
            cookie_name=settings.backend_api_cookie_name,
            csrf_cookie_name=settings.backend_api_csrf_cookie_name,
        )

    return WebAppConfig(
        key="crossplat",
        cookie_name=settings.backend_cookie_name,
        csrf_cookie_name=settings.backend_csrf_cookie_name,
    )

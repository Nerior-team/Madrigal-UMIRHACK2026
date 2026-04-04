from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.security import verify_signed_csrf_token
from app.infra.redis import limits as redis_limits


SENSITIVE_API_PATHS = {
    ("POST", "/api/v1/auth/register"),
    ("POST", "/api/v1/auth/register/verify"),
    ("POST", "/api/v1/auth/login"),
    ("POST", "/api/v1/auth/login/2fa/totp"),
    ("POST", "/api/v1/auth/password/forgot"),
    ("POST", "/api/v1/auth/password/reset"),
    ("POST", "/api/v1/auth/re-auth"),
}
CSRF_EXEMPT_API_PATHS = {
    ("POST", "/api/v1/auth/register"),
    ("POST", "/api/v1/auth/register/verify"),
    ("POST", "/api/v1/auth/login"),
    ("POST", "/api/v1/auth/login/2fa/totp"),
    ("POST", "/api/v1/auth/login/2fa/telegram"),
    ("POST", "/api/v1/auth/password/forgot"),
    ("POST", "/api/v1/auth/password/reset"),
    ("POST", "/api/v1/auth/refresh"),
}
UNSAFE_HTTP_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def install_security_middleware(app: FastAPI) -> None:
    settings = get_settings()

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        if (
            request.url.path.startswith("/api/")
            and request.method in UNSAFE_HTTP_METHODS
            and (request.method, request.url.path) not in CSRF_EXEMPT_API_PATHS
        ):
            authorization = request.headers.get("Authorization")
            session_cookie = request.cookies.get(settings.backend_cookie_name)
            if session_cookie and not (authorization and authorization.startswith("Bearer ")):
                origin = request.headers.get("Origin")
                if origin and origin not in settings.allowed_origins:
                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": {
                                "code": "origin_forbidden",
                                "message": "Источник запроса не разрешён.",
                            }
                        },
                    )
                csrf_cookie = request.cookies.get(settings.backend_csrf_cookie_name)
                csrf_header = request.headers.get(settings.backend_csrf_header_name)
                if (
                    not csrf_cookie
                    or not csrf_header
                    or csrf_cookie != csrf_header
                    or not verify_signed_csrf_token(csrf_cookie)
                ):
                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": {
                                "code": "csrf_invalid",
                                "message": "Требуется корректный CSRF-токен.",
                            }
                        },
                    )
        if (request.method, request.url.path) in SENSITIVE_API_PATHS:
            client_ip = request.client.host if request.client is not None else "unknown"
            rate_key = f"ratelimit:{request.method}:{request.url.path}:{client_ip}"
            try:
                hits, ttl = redis_limits.increment_window_counter(
                    key=rate_key,
                    ttl_seconds=settings.auth_endpoint_rate_limit_window_seconds,
                )
            except Exception:
                hits, ttl = 0, 0
            if hits > settings.auth_endpoint_rate_limit_max_requests:
                return JSONResponse(
                    status_code=429,
                    headers={"Retry-After": str(ttl or settings.auth_endpoint_rate_limit_window_seconds)},
                    content={
                        "error": {
                            "code": "rate_limited",
                            "message": "Слишком много запросов. Попробуйте позже.",
                        }
                    },
                )
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        )
        if request.url.path.startswith("/api/"):
            response.headers.setdefault("Cache-Control", "no-store")
            response.headers.setdefault("Pragma", "no-cache")
        if settings.backend_cookie_secure:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response

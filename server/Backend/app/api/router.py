from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/health", tags=["system"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@api_router.get("/version", tags=["system"])
def version() -> dict[str, str]:
    return {"service": "madrigal-backend", "version": "0.1.0"}

from functools import lru_cache

from redis import Redis

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_redis_client() -> Redis:
    settings = get_settings()
    return Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        decode_responses=True,
        socket_timeout=1,
        socket_connect_timeout=1,
        health_check_interval=30,
    )

from app.infra.redis.client import get_redis_client


def increment_window_counter(*, key: str, ttl_seconds: int) -> tuple[int, int]:
    client = get_redis_client()
    current = int(client.incr(key))
    if current == 1:
        client.expire(key, ttl_seconds)
    ttl = max(int(client.ttl(key)), 0)
    return current, ttl


def get_ttl(*, key: str) -> int:
    client = get_redis_client()
    return max(int(client.ttl(key)), 0)


def set_flag(*, key: str, ttl_seconds: int, value: str = "1") -> None:
    client = get_redis_client()
    client.set(name=key, value=value, ex=ttl_seconds)


def key_exists(*, key: str) -> bool:
    client = get_redis_client()
    return bool(client.exists(key))


def delete_keys(*keys: str) -> None:
    if not keys:
        return
    client = get_redis_client()
    client.delete(*keys)

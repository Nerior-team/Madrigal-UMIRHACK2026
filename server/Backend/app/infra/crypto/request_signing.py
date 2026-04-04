import hashlib
import hmac


def build_request_target(*, path: str, query: str) -> str:
    if query:
        return f"{path}?{query}"
    return path


def sign_request(
    *,
    secret: str,
    method: str,
    request_target: str,
    timestamp: str,
    nonce: str,
    body: bytes,
) -> str:
    payload = b"\n".join(
        [
            method.upper().encode("utf-8"),
            request_target.encode("utf-8"),
            timestamp.encode("utf-8"),
            nonce.encode("utf-8"),
            body,
        ]
    )
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()

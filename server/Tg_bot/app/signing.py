from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time


def serialize_json_body(payload: object) -> bytes:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")


def sign_request(
    *,
    secret: str,
    method: str,
    request_target: str,
    timestamp: str,
    nonce: str,
    body: bytes,
) -> str:
    message = b"\n".join(
        [
            method.upper().encode("utf-8"),
            request_target.encode("utf-8"),
            timestamp.encode("utf-8"),
            nonce.encode("utf-8"),
            body,
        ]
    )
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def build_signed_headers(*, secret: str, method: str, request_target: str, body: bytes) -> dict[str, str]:
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(16)
    signature = sign_request(
        secret=secret,
        method=method,
        request_target=request_target,
        timestamp=timestamp,
        nonce=nonce,
        body=body,
    )
    return {
        "X-Internal-Timestamp": timestamp,
        "X-Internal-Nonce": nonce,
        "X-Internal-Signature": signature,
    }

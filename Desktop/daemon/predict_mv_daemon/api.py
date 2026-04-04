import json
from dataclasses import dataclass
from urllib import error, parse, request

from predict_mv_daemon.models import AgentIdentity, ClaimedTask, RegistrationContext


@dataclass(slots=True)
class ApiError(Exception):
    status_code: int
    code: str
    message: str

    def __str__(self) -> str:
        return f"{self.status_code} {self.code}: {self.message}"


class ApiClient:
    def __init__(self, backend_base_url: str) -> None:
        self.backend_base_url = backend_base_url.rstrip("/")

    def _build_url(self, path: str) -> str:
        return f"{self.backend_base_url}{path}"

    def _request(
        self,
        *,
        method: str,
        path: str,
        token: str | None = None,
        payload: dict | None = None,
    ) -> dict | None:
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = request.Request(self._build_url(path), data=data, headers=headers, method=method)
        try:
            with request.urlopen(req, timeout=30) as response:
                body = response.read().decode("utf-8")
                return json.loads(body) if body else None
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            try:
                payload = json.loads(body) if body else {}
            except json.JSONDecodeError:
                payload = {}
            err = payload.get("error", {})
            raise ApiError(
                status_code=exc.code,
                code=err.get("code", "http_error"),
                message=err.get("message", body or "HTTP error"),
            ) from exc

    def start_registration(
        self,
        *,
        hostname: str,
        display_name: str | None,
        os_family: str,
        os_version: str | None,
        agent_version: str,
    ) -> RegistrationContext:
        payload = {
            "hostname": hostname,
            "display_name": display_name,
            "os_family": os_family,
            "os_version": os_version,
            "agent_version": agent_version,
        }
        response = self._request(method="POST", path="/api/v1/agent/registrations/start", payload=payload) or {}
        return RegistrationContext(**response)

    def complete_registration(self, *, registration_id: str, registration_token: str) -> dict:
        return self._request(
            method="POST",
            path=f"/api/v1/agent/registrations/{registration_id}/complete",
            payload={"registration_token": registration_token},
        ) or {}

    def get_agent_identity(self, *, machine_token: str) -> AgentIdentity:
        response = self._request(method="GET", path="/api/v1/agent/me", token=machine_token) or {}
        return AgentIdentity(**response)

    def send_heartbeat(self, *, machine_token: str, agent_version: str, status_payload: dict | None) -> dict:
        return self._request(
            method="POST",
            path="/api/v1/agent/heartbeat",
            token=machine_token,
            payload={"agent_version": agent_version, "status_payload": status_payload or {}},
        ) or {}

    def claim_task(self, *, machine_token: str) -> ClaimedTask | None:
        response = self._request(method="POST", path="/api/v1/agent/tasks/claim", token=machine_token)
        if response is None:
            return None
        return ClaimedTask(**response)

    def mark_accepted(self, *, machine_token: str, attempt_id: str) -> None:
        self._request(method="POST", path=f"/api/v1/agent/tasks/{attempt_id}/accepted", token=machine_token)

    def update_progress(
        self,
        *,
        machine_token: str,
        attempt_id: str,
        message: str,
        percent: int | None = None,
    ) -> None:
        self._request(
            method="POST",
            path=f"/api/v1/agent/tasks/{attempt_id}/progress",
            token=machine_token,
            payload={"message": message, "percent": percent},
        )

    def append_log(
        self,
        *,
        machine_token: str,
        attempt_id: str,
        stream: str,
        sequence: int,
        chunk: str,
    ) -> None:
        self._request(
            method="POST",
            path=f"/api/v1/agent/tasks/{attempt_id}/logs",
            token=machine_token,
            payload={"stream": stream, "sequence": sequence, "chunk": chunk},
        )

    def submit_result(
        self,
        *,
        machine_token: str,
        attempt_id: str,
        stdout: str,
        stderr: str,
        exit_code: int,
        duration_ms: int,
    ) -> dict:
        return self._request(
            method="POST",
            path=f"/api/v1/agent/tasks/{attempt_id}/result",
            token=machine_token,
            payload={
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": exit_code,
                "duration_ms": duration_ms,
            },
        ) or {}

    def submit_failure(
        self,
        *,
        machine_token: str,
        attempt_id: str,
        error_kind: str,
        error_message: str,
        stdout: str,
        stderr: str,
        duration_ms: int,
    ) -> None:
        self._request(
            method="POST",
            path=f"/api/v1/agent/tasks/{attempt_id}/failed",
            token=machine_token,
            payload={
                "error_kind": error_kind,
                "error_message": error_message,
                "stdout": stdout,
                "stderr": stderr,
                "duration_ms": duration_ms,
            },
        )

    def unpair(self, *, machine_token: str) -> dict:
        return self._request(method="POST", path="/api/v1/agent/unpair", token=machine_token) or {}

    def websocket_url(self, *, machine_token: str) -> str:
        parsed = parse.urlsplit(self.backend_base_url)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        query = parse.urlencode({"machine_token": machine_token})
        return parse.urlunsplit((scheme, parsed.netloc, "/api/v1/ws/agent/control", query, ""))

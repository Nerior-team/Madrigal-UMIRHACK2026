import json
import os
from pathlib import Path

from predict_mv_daemon.models import DaemonState
from predict_mv_daemon.system import default_state_path


class StateStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or default_state_path()

    def load(self) -> DaemonState:
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        return DaemonState(**raw)

    def exists(self) -> bool:
        return self.path.exists()

    def save(self, state: DaemonState) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self.path.with_suffix(f"{self.path.suffix}.tmp")
        temp_path.write_text(json.dumps(state.as_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(temp_path, self.path)
        if os.name != "nt":
            os.chmod(self.path, 0o600)

    def clear(self) -> None:
        if self.path.exists():
            self.path.unlink()

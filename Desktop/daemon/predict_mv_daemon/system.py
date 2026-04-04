import os
import platform
from pathlib import Path


def detect_os_family() -> str:
    system_name = platform.system().lower()
    if system_name == "windows":
        return "windows"
    if system_name == "darwin":
        return "macos"
    if system_name == "linux":
        return "linux"
    return "unknown"


def default_hostname() -> str:
    return platform.node() or "unknown-host"


def default_os_version() -> str | None:
    value = platform.version() or platform.release()
    return value or None


def default_state_path() -> Path:
    if os.name == "nt":
        root = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
        return root / "PredictMV" / "daemon-state.json"
    if platform.system().lower() == "darwin":
        return Path.home() / "Library" / "Application Support" / "PredictMV" / "daemon-state.json"
    xdg_root = os.environ.get("XDG_CONFIG_HOME")
    base = Path(xdg_root) if xdg_root else Path.home() / ".config"
    return base / "predict-mv" / "daemon-state.json"

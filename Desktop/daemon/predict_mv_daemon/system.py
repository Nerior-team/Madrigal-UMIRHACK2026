import os
import platform
import sys
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


def detect_platform_id() -> str:
    machine = platform.machine().lower()
    normalized_machine = {
        "amd64": "x64",
        "x86_64": "x64",
        "arm64": "arm64",
        "aarch64": "arm64",
    }.get(machine, machine)
    return f"{detect_os_family()}-{normalized_machine}"


def download_segment() -> str:
    os_family = detect_os_family()
    if os_family in {"windows", "linux"}:
        return os_family
    return detect_platform_id()


def cli_binary_name() -> str:
    return "predict.exe" if os.name == "nt" else "predict"


def daemon_binary_name() -> str:
    return "PredictMV.exe" if os.name == "nt" else "PredictMV"


def default_install_dir() -> Path:
    if os.name == "nt":
        return Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Predict MV" / "Daemon"
    return Path("/opt/predict-mv/daemon")


def default_cli_path() -> Path:
    current = Path(sys.executable).resolve()
    sibling = current.parent / cli_binary_name()
    if sibling.exists():
        return sibling
    if os.name == "nt":
        return default_install_dir() / cli_binary_name()
    return Path("/usr/local/bin/predict")


def default_service_name() -> str:
    return "PredictMV" if os.name == "nt" else "predictmv"


def default_state_path() -> Path:
    if os.name == "nt":
        root = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
        return root / "PredictMV" / "daemon-state.json"
    if platform.system().lower() == "darwin":
        return Path.home() / "Library" / "Application Support" / "PredictMV" / "daemon-state.json"
    xdg_root = os.environ.get("XDG_CONFIG_HOME")
    base = Path(xdg_root) if xdg_root else Path.home() / ".config"
    return base / "predict-mv" / "daemon-state.json"

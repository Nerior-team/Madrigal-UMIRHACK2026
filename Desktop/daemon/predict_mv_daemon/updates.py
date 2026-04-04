import json
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from urllib import request

from predict_mv_daemon.system import default_cli_path, default_install_dir, download_segment
from predict_mv_daemon.versioning import is_newer_version


WINDOWS_INSTALLER_FLAGS = ["/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/SP-"]


@dataclass(frozen=True, slots=True)
class UpdateManifest:
    version: str
    platform: str
    channel: str
    download_segment: str
    daemon_binary: str
    cli_binary: str
    artifacts: list[dict]
    update: dict


def _base_download_url(backend_base_url: str) -> str:
    return f"{backend_base_url.rstrip('/')}/downloads/{download_segment()}"


def _fetch_json(url: str) -> dict:
    req = request.Request(url, method="GET")
    with request.urlopen(req, timeout=30) as response:
        body = response.read().decode("utf-8")
    return json.loads(body)


def fetch_manifest(backend_base_url: str) -> UpdateManifest:
    payload = _fetch_json(f"{_base_download_url(backend_base_url)}/manifest.json")
    return UpdateManifest(**payload)


def check_for_update(backend_base_url: str, *, current_version: str) -> UpdateManifest | None:
    manifest = fetch_manifest(backend_base_url)
    if is_newer_version(manifest.version, current_version):
        return manifest
    return None


def can_auto_apply_updates() -> bool:
    if os.name == "nt":
        return True
    geteuid = getattr(os, "geteuid", None)
    return bool(geteuid and geteuid() == 0)


def spawn_background_update(backend_base_url: str) -> bool:
    cli_path = default_cli_path()
    if not cli_path.exists():
        return False
    command = [str(cli_path), "update", "apply-internal", "--backend-url", backend_base_url]
    popen_kwargs = {
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
        "close_fds": True,
    }
    if os.name == "nt":
        popen_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS  # type: ignore[attr-defined]
    else:
        popen_kwargs["start_new_session"] = True
    subprocess.Popen(command, **popen_kwargs)
    return True


def _download_file(url: str, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with request.urlopen(url, timeout=120) as response:
        destination.write_bytes(response.read())
    return destination


def apply_update(backend_base_url: str, *, current_version: str) -> tuple[bool, str]:
    manifest = check_for_update(backend_base_url, current_version=current_version)
    if manifest is None:
        return False, "Already up to date."
    _apply_manifest(backend_base_url, manifest)
    return True, f"Updating to {manifest.version}"


def _apply_manifest(backend_base_url: str, manifest: UpdateManifest) -> None:
    if os.name == "nt":
        _apply_windows_update(backend_base_url, manifest)
        return
    _apply_linux_update(backend_base_url, manifest)


def _apply_windows_update(backend_base_url: str, manifest: UpdateManifest) -> None:
    temp_root = Path(tempfile.mkdtemp(prefix="predictmv-update-"))
    update_file = manifest.update["file"]
    installer_path = _download_file(f"{_base_download_url(backend_base_url)}/{update_file}", temp_root / update_file)
    service_exe = default_install_dir() / "PredictMVService.exe"
    launcher_path = temp_root / "apply-update.cmd"
    launcher_path.write_text(
        "\r\n".join(
            [
                "@echo off",
                "setlocal",
                f"\"{service_exe}\" stop >nul 2>&1" if service_exe.exists() else "rem service not installed yet",
                f"\"{installer_path}\" {' '.join(WINDOWS_INSTALLER_FLAGS)}",
            ]
        )
        + "\r\n",
        encoding="utf-8",
    )
    subprocess.Popen(
        ["cmd.exe", "/c", str(launcher_path)],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        close_fds=True,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS,  # type: ignore[attr-defined]
    )


def _apply_linux_update(backend_base_url: str, manifest: UpdateManifest) -> None:
    if not can_auto_apply_updates():
        raise PermissionError("Linux auto-update requires root privileges.")
    temp_root = Path(tempfile.mkdtemp(prefix="predictmv-update-"))
    try:
        install_script_name = manifest.update["install_script_file"]
        archive_name = manifest.update["archive_file"]
        install_script = _download_file(
            f"{_base_download_url(backend_base_url)}/{install_script_name}",
            temp_root / install_script_name,
        )
        archive_path = _download_file(
            f"{_base_download_url(backend_base_url)}/{archive_name}",
            temp_root / archive_name,
        )
        os.chmod(install_script, 0o755)
        subprocess.run(
            [
                "bash",
                str(install_script),
                "--archive-path",
                str(archive_path),
            ],
            check=True,
        )
    finally:
        shutil.rmtree(temp_root, ignore_errors=True)


def pretty_manifest_url(backend_base_url: str) -> str:
    return f"{_base_download_url(backend_base_url)}/manifest.json"

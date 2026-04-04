import argparse
from importlib.util import find_spec
import json
import platform
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from predict_mv_daemon import __version__


ROOT = Path(__file__).resolve().parent
DIST_ROOT = ROOT / "dist"
BUILD_ROOT = ROOT / "build"
PYINSTALLER_ROOT = ROOT / "pyinstaller"


@dataclass(frozen=True, slots=True)
class BuildTarget:
    key: str
    spec_path: Path
    artifact_name: str


TARGETS: dict[str, BuildTarget] = {
    "daemon": BuildTarget(
        key="daemon",
        spec_path=PYINSTALLER_ROOT / "daemon.spec",
        artifact_name="PredictMV",
    ),
    "cli": BuildTarget(
        key="cli",
        spec_path=PYINSTALLER_ROOT / "daemon-cli.spec",
        artifact_name="predict",
    ),
}


def ensure_build_dependencies(selected_targets: list[BuildTarget]) -> None:
    required_modules = {"PyInstaller"}
    if any(target.key == "daemon" for target in selected_targets):
        required_modules.add("websockets")

    missing = [name for name in sorted(required_modules) if find_spec(name) is None]
    if missing:
        joined = ", ".join(missing)
        raise SystemExit(f"Missing build dependency: {joined}. Run `python -m pip install -r requirements.txt`.")


def detect_platform_id() -> str:
    system_name = platform.system().lower()
    machine = platform.machine().lower()
    normalized_machine = {
        "amd64": "x64",
        "x86_64": "x64",
        "arm64": "arm64",
        "aarch64": "arm64",
    }.get(machine, machine)
    return f"{system_name}-{normalized_machine}"


def executable_name(base_name: str) -> str:
    return f"{base_name}.exe" if platform.system().lower() == "windows" else base_name


def download_segment(platform_id: str) -> str:
    if platform_id.startswith("windows-"):
        return "windows"
    if platform_id.startswith("linux-"):
        return "linux"
    return platform_id


def linux_archive_name(platform_id: str) -> str:
    return f"predictmv-{platform_id}.tar.gz"


def build_command(*, target: BuildTarget, dist_dir: Path, work_dir: Path) -> list[str]:
    return [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--distpath",
        str(dist_dir),
        "--workpath",
        str(work_dir),
        str(target.spec_path),
    ]


def write_manifest(*, platform_id: str, dist_dir: Path, selected_targets: list[BuildTarget]) -> Path:
    segment = download_segment(platform_id)
    manifest = {
        "version": __version__,
        "platform": platform_id,
        "channel": "stable",
        "download_segment": segment,
        "daemon_binary": executable_name(TARGETS["daemon"].artifact_name),
        "cli_binary": executable_name(TARGETS["cli"].artifact_name),
        "artifacts": [
            {
                "target": target.key,
                "file": executable_name(target.artifact_name),
                "path": str((dist_dir / executable_name(target.artifact_name)).relative_to(ROOT)),
            }
            for target in selected_targets
        ],
    }
    if segment == "windows":
        manifest["update"] = {
            "mode": "installer",
            "file": "PredictMVDaemonSetup.exe",
        }
    elif segment == "linux":
        manifest["update"] = {
            "mode": "archive",
            "archive_file": linux_archive_name(platform_id),
            "install_script_file": "install.sh",
        }
    manifest_path = dist_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest_path


def run_build(*, selected_targets: list[BuildTarget], platform_id: str, dry_run: bool) -> int:
    dist_dir = DIST_ROOT / platform_id
    work_root = BUILD_ROOT / platform_id
    plan: list[dict[str, str]] = []

    for target in selected_targets:
        artifact_path = dist_dir / executable_name(target.artifact_name)
        work_dir = work_root / target.key
        plan.append(
            {
                "target": target.key,
                "artifact": str(artifact_path),
                "spec": str(target.spec_path),
                "work_dir": str(work_dir),
                "command": " ".join(build_command(target=target, dist_dir=dist_dir, work_dir=work_dir)),
            }
        )

    if dry_run:
        print(json.dumps({"version": __version__, "platform": platform_id, "plan": plan}, ensure_ascii=False, indent=2))
        return 0

    DIST_ROOT.mkdir(parents=True, exist_ok=True)
    dist_dir.mkdir(parents=True, exist_ok=True)
    for target in selected_targets:
        artifact_path = dist_dir / executable_name(target.artifact_name)
        work_dir = work_root / target.key
        if artifact_path.exists():
            artifact_path.unlink()
        shutil.rmtree(work_dir, ignore_errors=True)
        subprocess.run(
            build_command(target=target, dist_dir=dist_dir, work_dir=work_dir),
            cwd=ROOT,
            check=True,
        )

    write_manifest(platform_id=platform_id, dist_dir=dist_dir, selected_targets=selected_targets)
    print(f"Built {len(selected_targets)} artifact(s) into {dist_dir}")
    return 0


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="predict-mv-daemon-build")
    parser.add_argument(
        "--target",
        choices=("all", "daemon", "cli"),
        default="all",
        help="Which binary targets to build.",
    )
    parser.add_argument(
        "--platform-id",
        default=detect_platform_id(),
        help="Artifact platform layout name, for example windows-x64 or linux-x64.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the planned artifact layout and PyInstaller commands without building.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    selected_targets = list(TARGETS.values()) if args.target == "all" else [TARGETS[args.target]]
    ensure_build_dependencies(selected_targets)
    return run_build(selected_targets=selected_targets, platform_id=args.platform_id, dry_run=args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())

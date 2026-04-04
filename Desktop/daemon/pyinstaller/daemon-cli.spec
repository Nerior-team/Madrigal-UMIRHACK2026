# -*- mode: python ; coding: utf-8 -*-

import os
from pathlib import Path


daemon_root = Path(SPECPATH).resolve().parent
candidate_cli_roots = [daemon_root / "daemon-cli", daemon_root.parent / "daemon-cli"]
cli_root = next((path for path in candidate_cli_roots if path.exists()), candidate_cli_roots[0])
icon_path = daemon_root / "assets" / "logo.ico"
if os.name == "nt":
    runtime_tmpdir = str(Path(os.environ.get("PROGRAMDATA", r"C:\ProgramData")) / "PredictMV" / "tmp")
else:
    runtime_tmpdir = None

a = Analysis(
    [str(cli_root / "main.py")],
    pathex=[str(daemon_root), str(cli_root)],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)
is_windows = os.name == "nt"

exe = EXE(
    pyz,
    a.scripts,
    a.binaries if is_windows else [],
    a.datas if is_windows else [],
    [],
    name="predict",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    icon=str(icon_path) if icon_path.exists() else None,
    exclude_binaries=not is_windows,
    runtime_tmpdir=runtime_tmpdir,
)

if not is_windows:
    coll = COLLECT(
        exe,
        a.binaries,
        a.datas,
        strip=False,
        upx=False,
        name="predict",
    )

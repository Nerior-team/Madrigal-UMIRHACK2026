# -*- mode: python ; coding: utf-8 -*-

import os
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules


daemon_root = Path(SPECPATH).resolve().parent
icon_path = daemon_root / "assets" / "logo.ico"
if os.name == "nt":
    runtime_tmpdir = str(Path(os.environ.get("PROGRAMDATA", r"C:\ProgramData")) / "PredictMV" / "tmp")
else:
    runtime_tmpdir = None

a = Analysis(
    [str(daemon_root / "main.py")],
    pathex=[str(daemon_root)],
    binaries=[],
    datas=[],
    hiddenimports=collect_submodules("websockets"),
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
    name="PredictMV",
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
        name="PredictMV",
    )

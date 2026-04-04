# -*- mode: python ; coding: utf-8 -*-

import os
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules


daemon_root = Path(SPECPATH).resolve().parent
icon_path = daemon_root / "assets" / "logo.ico"
runtime_tmpdir = str(Path(os.environ.get("PROGRAMDATA", r"C:\ProgramData")) / "PredictMV" / "tmp")

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

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="PredictMV",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    icon=str(icon_path) if icon_path.exists() else None,
    runtime_tmpdir=runtime_tmpdir,
)

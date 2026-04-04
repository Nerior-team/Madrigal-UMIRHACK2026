# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path


daemon_root = Path(SPECPATH).resolve().parent

a = Analysis(
    [str(daemon_root / "main.py")],
    pathex=[str(daemon_root)],
    binaries=[],
    datas=[],
    hiddenimports=["websockets"],
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
    name="predict-mv-daemon",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
)

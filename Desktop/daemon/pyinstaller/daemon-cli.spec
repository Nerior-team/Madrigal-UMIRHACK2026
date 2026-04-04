# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path


daemon_root = Path(SPECPATH).resolve().parent
candidate_cli_roots = [daemon_root / "daemon-cli", daemon_root.parent / "daemon-cli"]
cli_root = next((path for path in candidate_cli_roots if path.exists()), candidate_cli_roots[0])
icon_path = daemon_root / "assets" / "logo.ico"

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

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="predict",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    icon=str(icon_path) if icon_path.exists() else None,
)

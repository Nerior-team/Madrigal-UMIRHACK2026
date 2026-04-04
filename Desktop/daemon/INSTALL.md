# PredictMV Daemon Installation

## Supported Targets

- Windows 10 x64
- Windows 11 x64
- Ubuntu 22.04+ x86_64
- Debian 12+ x86_64

Linux support assumes `systemd`.

## Windows

1. Download `PredictMVDaemonSetup.exe`.
2. Run the installer as administrator.
3. After installation, pair the machine:

```powershell
predict pair --backend-url https://nerior.store
```

4. Confirm the shown device code in the web UI.
5. Check agent status:

```powershell
predict status
```

## Linux

Install:

```bash
curl -fsSL https://nerior.store/downloads/linux/install.sh | bash
```

Pair the machine:

```bash
predict pair --backend-url https://nerior.store
```

Check status:

```bash
predict status
```

Unpair:

```bash
predict unpair
```

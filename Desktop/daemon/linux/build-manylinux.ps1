$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$WorkspaceDir = Split-Path -Parent $RootDir
$Image = if ($env:MANYLINUX_IMAGE) { $env:MANYLINUX_IMAGE } else { "python:3.12-slim-bookworm" }
$PythonStandaloneUrl = if ($env:PYTHON_STANDALONE_URL) { $env:PYTHON_STANDALONE_URL } else { "https://github.com/astral-sh/python-build-standalone/releases/download/20260303/cpython-3.12.13%2B20260303-x86_64-unknown-linux-gnu-install_only.tar.gz" }
$PythonStandaloneArchive = if ($env:PYTHON_STANDALONE_ARCHIVE) { $env:PYTHON_STANDALONE_ARCHIVE } else { $null }
$PlatformId = if ($env:PLATFORM_ID) { $env:PLATFORM_ID } else { "linux-x64" }

$WorkspaceDirUnix = ($WorkspaceDir -replace "\\", "/") -replace "^([A-Za-z]):", '/$1'
$ArchiveCandidates = @()
if ($PythonStandaloneArchive) {
    $ArchiveCandidates += $PythonStandaloneArchive
}
$ArchiveCandidates += @(
    (Join-Path $RootDir "cpython-3.12.13+20260303-x86_64-unknown-linux-gnu-install_only.tar.gz"),
    (Join-Path $RootDir "build\\runtime-cache\\cpython-3.12.13+20260303-x86_64-unknown-linux-gnu-install_only.tar.gz")
)

$ArchiveMount = ""
foreach ($candidate in $ArchiveCandidates) {
    if (-not $candidate) {
        continue
    }
    if (Test-Path -LiteralPath $candidate) {
        $resolved = (Resolve-Path -LiteralPath $candidate).Path
        if ($resolved.StartsWith($WorkspaceDir, [System.StringComparison]::OrdinalIgnoreCase)) {
            $relative = $resolved.Substring($WorkspaceDir.Length).TrimStart('\')
            $ArchiveMount = "/workspace/" + (($relative -replace "\\", "/"))
            break
        }
    }
}

docker run --rm `
  --entrypoint /bin/bash `
  -v "${WorkspaceDirUnix}:/workspace" `
  -w /workspace/daemon `
  $Image `
  -lc @"
set -euo pipefail
apt-get update >/dev/null
apt-get install -y binutils ca-certificates curl >/dev/null
ARCHIVE_PATH='$ArchiveMount'
if [[ -n "`$ARCHIVE_PATH" && -f "`$ARCHIVE_PATH" ]]; then
  cp "`$ARCHIVE_PATH" /tmp/python-build-standalone.tar.gz
else
  curl -fL --retry 5 --retry-delay 2 '$PythonStandaloneUrl' -o /tmp/python-build-standalone.tar.gz
fi
mkdir -p /tmp/python-build-standalone
tar -xzf /tmp/python-build-standalone.tar.gz -C /tmp/python-build-standalone
PYTHON_BIN=`$(find /tmp/python-build-standalone -type f -path '*/bin/python3.12' | head -n1)
if [[ -z "`$PYTHON_BIN" ]]; then
  echo 'Standalone Python runtime not found after extraction.' >&2
  exit 1
fi
`$PYTHON_BIN -m pip install --upgrade pip
`$PYTHON_BIN -m pip install -r requirements.txt
`$PYTHON_BIN build.py --target all --platform-id $PlatformId
PLATFORM_ID=$PlatformId bash linux/package.sh
"@

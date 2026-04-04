#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DAEMON_ROOT="${REPO_ROOT}/Desktop/daemon"
DOWNLOADS_ROOT="${REPO_ROOT}/server/downloads"
WINDOWS_SOURCE="${DAEMON_ROOT}/dist/windows-x64/PredictMVDaemonSetup.exe"
LINUX_ARCHIVE_SOURCE="${DAEMON_ROOT}/dist/linux-x64/predict-mv-daemon-linux-x64.tar.gz"
LINUX_INSTALL_SOURCE="${DAEMON_ROOT}/linux/install.sh"
LINUX_UNINSTALL_SOURCE="${DAEMON_ROOT}/linux/uninstall.sh"

if [[ "${1:-}" == "--dry-run" ]]; then
  cat <<EOF
windows_source=${WINDOWS_SOURCE}
linux_archive_source=${LINUX_ARCHIVE_SOURCE}
linux_install_source=${LINUX_INSTALL_SOURCE}
linux_uninstall_source=${LINUX_UNINSTALL_SOURCE}
downloads_root=${DOWNLOADS_ROOT}
EOF
  exit 0
fi

for path in "${WINDOWS_SOURCE}" "${LINUX_ARCHIVE_SOURCE}" "${LINUX_INSTALL_SOURCE}" "${LINUX_UNINSTALL_SOURCE}"; do
  if [[ ! -f "${path}" ]]; then
    echo "Missing source artifact: ${path}" >&2
    exit 1
  fi
done

mkdir -p "${DOWNLOADS_ROOT}/windows" "${DOWNLOADS_ROOT}/linux"
cp "${WINDOWS_SOURCE}" "${DOWNLOADS_ROOT}/windows/PredictMVDaemonSetup.exe"
cp "${LINUX_ARCHIVE_SOURCE}" "${DOWNLOADS_ROOT}/linux/predict-mv-daemon-linux-x64.tar.gz"
cp "${LINUX_INSTALL_SOURCE}" "${DOWNLOADS_ROOT}/linux/install.sh"
cp "${LINUX_UNINSTALL_SOURCE}" "${DOWNLOADS_ROOT}/linux/uninstall.sh"

echo "Daemon artifacts published into ${DOWNLOADS_ROOT}"

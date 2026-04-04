#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="predict-mv-daemon"
INSTALL_DIR="/opt/predict-mv/daemon"
STATE_DIR="/var/lib/predict-mv"
LOG_DIR="/var/log/predict-mv"
SYSTEMD_DIR="/etc/systemd/system"
CLI_LINK="/usr/local/bin/predict-mv-daemon-cli"
PURGE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --purge)
      PURGE="true"
      shift
      ;;
    --install-dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    --state-dir)
      STATE_DIR="$2"
      shift 2
      ;;
    --log-dir)
      LOG_DIR="$2"
      shift 2
      ;;
    --systemd-dir)
      SYSTEMD_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run uninstall.sh as root." >&2
  exit 1
fi

SERVICE_PATH="${SYSTEMD_DIR}/${SERVICE_NAME}.service"

if systemctl list-unit-files | grep -q "^${SERVICE_NAME}\.service"; then
  systemctl stop "${SERVICE_NAME}" || true
  systemctl disable "${SERVICE_NAME}" || true
fi

rm -f "${SERVICE_PATH}"
systemctl daemon-reload
rm -f "${CLI_LINK}"
rm -rf "${INSTALL_DIR}"

if [[ "${PURGE}" == "true" ]]; then
  rm -rf "${STATE_DIR}" "${LOG_DIR}"
fi

echo "Predict MV daemon uninstalled."

#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="predictmv"
SERVICE_USER="predict-mv"
INSTALL_DIR="/opt/predict-mv/daemon"
STATE_DIR="/var/lib/predict-mv"
LOG_DIR="/var/log/predict-mv"
SYSTEMD_DIR="/etc/systemd/system"
CLI_LINK="/usr/local/bin/predict"
DOWNLOAD_BASE_URL="https://nerior.store/downloads/linux"
ARCHIVE_NAME="predictmv-linux-x64.tar.gz"
ARCHIVE_URL="${DOWNLOAD_BASE_URL}/${ARCHIVE_NAME}"
ARCHIVE_PATH=""
SKIP_START="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --archive-url)
      ARCHIVE_URL="$2"
      shift 2
      ;;
    --archive-path)
      ARCHIVE_PATH="$2"
      shift 2
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
    --service-user)
      SERVICE_USER="$2"
      shift 2
      ;;
    --skip-start)
      SKIP_START="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run install.sh as root." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d)"
ARCHIVE_TMP="${TMP_DIR}/${ARCHIVE_NAME}"
SERVICE_PATH="${SYSTEMD_DIR}/${SERVICE_NAME}.service"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

download_archive() {
  if [[ -n "${ARCHIVE_PATH}" ]]; then
    cp "${ARCHIVE_PATH}" "${ARCHIVE_TMP}"
    return
  fi

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "${ARCHIVE_URL}" -o "${ARCHIVE_TMP}"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO "${ARCHIVE_TMP}" "${ARCHIVE_URL}"
    return
  fi

  echo "curl or wget is required to download the daemon archive." >&2
  exit 1
}

resolve_nologin() {
  for candidate in /usr/sbin/nologin /sbin/nologin /bin/false; do
    if [[ -x "${candidate}" ]]; then
      echo "${candidate}"
      return
    fi
  done
  echo "/bin/false"
}

ensure_service_user() {
  if id -u "${SERVICE_USER}" >/dev/null 2>&1; then
    return
  fi
  useradd \
    --system \
    --home "${STATE_DIR}" \
    --shell "$(resolve_nologin)" \
    --user-group \
    "${SERVICE_USER}"
}

download_archive
ensure_service_user

mkdir -p "${INSTALL_DIR}" "${STATE_DIR}/config" "${LOG_DIR}" "${SYSTEMD_DIR}"
tar -xzf "${ARCHIVE_TMP}" -C "${TMP_DIR}"
install -m 0755 "${TMP_DIR}/bin/PredictMV" "${INSTALL_DIR}/PredictMV"
install -m 0755 "${TMP_DIR}/bin/predict" "${INSTALL_DIR}/predict"
ln -sf "${INSTALL_DIR}/predict" "${CLI_LINK}"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "${INSTALL_DIR}" "${STATE_DIR}" "${LOG_DIR}"

cat > "${SERVICE_PATH}" <<EOF
[Unit]
Description=PredictMV Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}
Environment=XDG_CONFIG_HOME=${STATE_DIR}/config
ExecStart=${INSTALL_DIR}/PredictMV
Restart=always
RestartSec=5
KillMode=process
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}" >/dev/null
if [[ "${SKIP_START}" != "true" ]]; then
  systemctl restart "${SERVICE_NAME}"
fi

cat <<EOF
PredictMV daemon installed.
Service: ${SERVICE_NAME}
CLI: ${CLI_LINK}

Next step:
predict pair --backend-url https://nerior.store
EOF

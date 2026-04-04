#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="predict-mv-daemon"
SERVICE_USER="predict-mv"
INSTALL_DIR="/opt/predict-mv/daemon"
STATE_DIR="/var/lib/predict-mv"
LOG_DIR="/var/log/predict-mv"
SYSTEMD_DIR="/etc/systemd/system"
CLI_LINK="/usr/local/bin/predict-mv-daemon-cli"
DOWNLOAD_BASE_URL="https://nerior.store/downloads/linux"
ARCHIVE_NAME="predict-mv-daemon-linux-x64.tar.gz"
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
SERVICE_TEMPLATE="${SCRIPT_DIR}/predict-mv-daemon.service"
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
install -m 0755 "${TMP_DIR}/bin/predict-mv-daemon" "${INSTALL_DIR}/predict-mv-daemon"
install -m 0755 "${TMP_DIR}/bin/predict-mv-daemon-cli" "${INSTALL_DIR}/predict-mv-daemon-cli"
ln -sf "${INSTALL_DIR}/predict-mv-daemon-cli" "${CLI_LINK}"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "${INSTALL_DIR}" "${STATE_DIR}" "${LOG_DIR}"

sed \
  -e "s|/opt/predict-mv/daemon|${INSTALL_DIR}|g" \
  -e "s|/var/lib/predict-mv|${STATE_DIR}|g" \
  -e "s|/var/log/predict-mv|${LOG_DIR}|g" \
  -e "s|User=predict-mv|User=${SERVICE_USER}|g" \
  -e "s|Group=predict-mv|Group=${SERVICE_USER}|g" \
  "${SERVICE_TEMPLATE}" > "${SERVICE_PATH}"

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}" >/dev/null
if [[ "${SKIP_START}" != "true" ]]; then
  systemctl restart "${SERVICE_NAME}"
fi

cat <<EOF
Predict MV daemon installed.
Service: ${SERVICE_NAME}
CLI: ${CLI_LINK}

Next step:
predict-mv-daemon-cli pair --backend-url https://nerior.store
EOF

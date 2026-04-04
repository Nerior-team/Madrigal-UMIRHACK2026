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
STATE_FILE="${STATE_DIR}/daemon-state.json"
RUNTIME_TMP_DIR="${STATE_DIR}/tmp"

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
SERVICE_PATH="${SYSTEMD_DIR}/${SERVICE_NAME}.service"
INSTALL_TMP_DIR=""
ARCHIVE_TMP=""

cleanup() {
  if [[ -n "${INSTALL_TMP_DIR}" ]]; then
    rm -rf "${INSTALL_TMP_DIR}"
  fi
}
trap cleanup EXIT

version_ge() {
  local current="$1"
  local required="$2"
  [[ "$(printf '%s\n%s\n' "${required}" "${current}" | sort -V | head -n1)" == "${required}" ]]
}

detect_glibc_version() {
  if command -v getconf >/dev/null 2>&1; then
    local version
    version="$(getconf GNU_LIBC_VERSION 2>/dev/null | awk '{print $2}')"
    if [[ -n "${version}" ]]; then
      echo "${version}"
      return
    fi
  fi

  if command -v ldd >/dev/null 2>&1; then
    local version
    version="$(ldd --version 2>&1 | head -n1 | grep -oE '[0-9]+\.[0-9]+' | head -n1 || true)"
    if [[ -n "${version}" ]]; then
      echo "${version}"
      return
    fi
  fi

  echo ""
}

ensure_runtime_compatibility() {
  local glibc_version
  glibc_version="$(detect_glibc_version)"

  if [[ -z "${glibc_version}" ]]; then
    echo "Unable to determine glibc version. PredictMV requires glibc 2.28+." >&2
    exit 1
  fi

  if ! version_ge "${glibc_version}" "2.28"; then
    echo "Unsupported glibc version ${glibc_version}. PredictMV requires glibc 2.28+." >&2
    exit 1
  fi
}

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

ensure_runtime_compatibility
ensure_service_user

mkdir -p "${INSTALL_DIR}" "${STATE_DIR}" "${RUNTIME_TMP_DIR}" "${LOG_DIR}" "${SYSTEMD_DIR}"
INSTALL_TMP_DIR="$(mktemp -d "${STATE_DIR}/install.XXXXXX")"
ARCHIVE_TMP="${INSTALL_TMP_DIR}/${ARCHIVE_NAME}"
download_archive
tar -xzf "${ARCHIVE_TMP}" -C "${INSTALL_TMP_DIR}"

if systemctl list-unit-files | grep -q "^${SERVICE_NAME}\.service"; then
  systemctl stop "${SERVICE_NAME}" || true
fi

rm -rf "${INSTALL_DIR}/daemon" "${INSTALL_DIR}/cli"
cp -R "${INSTALL_TMP_DIR}/daemon" "${INSTALL_DIR}/daemon"
cp -R "${INSTALL_TMP_DIR}/cli" "${INSTALL_DIR}/cli"
chmod 0755 "${INSTALL_DIR}/daemon/PredictMV" "${INSTALL_DIR}/cli/predict"
cat > "${CLI_LINK}" <<EOF
#!/usr/bin/env bash
export PREDICTMV_STATE_PATH="${STATE_FILE}"
export TMPDIR="${RUNTIME_TMP_DIR}"
exec "${INSTALL_DIR}/cli/predict" "\$@"
EOF
chmod 0755 "${CLI_LINK}"
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
Environment=PREDICTMV_STATE_PATH=${STATE_FILE}
Environment=TMPDIR=${RUNTIME_TMP_DIR}
ExecStart=${INSTALL_DIR}/daemon/PredictMV
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
sudo predict pair --backend-url https://nerior.store
EOF

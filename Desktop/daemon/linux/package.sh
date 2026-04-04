#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_ROOT="${ROOT_DIR}/dist"
PLATFORM_ID="${PLATFORM_ID:-linux-x64}"
ARCHIVE_NAME="predict-mv-daemon-${PLATFORM_ID}.tar.gz"
ARTIFACT_DIR="${DIST_ROOT}/${PLATFORM_ID}"
PACKAGE_ROOT="${ARTIFACT_DIR}/package-root"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

DAEMON_BIN="${ARTIFACT_DIR}/predict-mv-daemon"
CLI_BIN="${ARTIFACT_DIR}/predict-mv-daemon-cli"
ARCHIVE_PATH="${ARTIFACT_DIR}/${ARCHIVE_NAME}"

if [[ "${DRY_RUN}" == "true" ]]; then
  cat <<EOF
platform=${PLATFORM_ID}
artifact_dir=${ARTIFACT_DIR}
archive=${ARCHIVE_PATH}
daemon_bin=${DAEMON_BIN}
cli_bin=${CLI_BIN}
EOF
  exit 0
fi

if [[ ! -f "${DAEMON_BIN}" ]]; then
  echo "Missing daemon binary: ${DAEMON_BIN}" >&2
  exit 1
fi

if [[ ! -f "${CLI_BIN}" ]]; then
  echo "Missing CLI binary: ${CLI_BIN}" >&2
  exit 1
fi

rm -rf "${PACKAGE_ROOT}"
mkdir -p "${PACKAGE_ROOT}/bin"
cp "${DAEMON_BIN}" "${PACKAGE_ROOT}/bin/predict-mv-daemon"
cp "${CLI_BIN}" "${PACKAGE_ROOT}/bin/predict-mv-daemon-cli"
chmod 0755 "${PACKAGE_ROOT}/bin/predict-mv-daemon" "${PACKAGE_ROOT}/bin/predict-mv-daemon-cli"

tar -C "${PACKAGE_ROOT}" -czf "${ARCHIVE_PATH}" .
echo "Created ${ARCHIVE_PATH}"

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_ROOT="${ROOT_DIR}/dist"
PLATFORM_ID="${PLATFORM_ID:-linux-x64}"
ARCHIVE_NAME="predictmv-${PLATFORM_ID}.tar.gz"
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

DAEMON_DIR="${ARTIFACT_DIR}/PredictMV"
CLI_DIR="${ARTIFACT_DIR}/predict"
ARCHIVE_PATH="${ARTIFACT_DIR}/${ARCHIVE_NAME}"

if [[ "${DRY_RUN}" == "true" ]]; then
  cat <<EOF
platform=${PLATFORM_ID}
artifact_dir=${ARTIFACT_DIR}
archive=${ARCHIVE_PATH}
daemon_dir=${DAEMON_DIR}
cli_dir=${CLI_DIR}
EOF
  exit 0
fi

if [[ ! -d "${DAEMON_DIR}" ]]; then
  echo "Missing daemon bundle: ${DAEMON_DIR}" >&2
  exit 1
fi

if [[ ! -d "${CLI_DIR}" ]]; then
  echo "Missing CLI bundle: ${CLI_DIR}" >&2
  exit 1
fi

rm -rf "${PACKAGE_ROOT}"
mkdir -p "${PACKAGE_ROOT}"
cp -R "${DAEMON_DIR}" "${PACKAGE_ROOT}/daemon"
cp -R "${CLI_DIR}" "${PACKAGE_ROOT}/cli"
chmod 0755 "${PACKAGE_ROOT}/daemon/PredictMV" "${PACKAGE_ROOT}/cli/predict"

tar -C "${PACKAGE_ROOT}" -czf "${ARCHIVE_PATH}" .
echo "Created ${ARCHIVE_PATH}"

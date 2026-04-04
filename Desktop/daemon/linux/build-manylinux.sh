#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_DIR="$(cd "${ROOT_DIR}/.." && pwd)"
IMAGE="${MANYLINUX_IMAGE:-python:3.12-slim-bookworm}"
PYTHON_STANDALONE_URL="${PYTHON_STANDALONE_URL:-https://github.com/astral-sh/python-build-standalone/releases/download/20260303/cpython-3.12.13%2B20260303-x86_64-unknown-linux-gnu-install_only.tar.gz}"
PLATFORM_ID="${PLATFORM_ID:-linux-x64}"

docker run --rm \
  -v "${WORKSPACE_DIR}:/workspace" \
  -w /workspace/daemon \
  "${IMAGE}" \
  /bin/bash -lc "
    set -euo pipefail
    apt-get update >/dev/null
    apt-get install -y binutils ca-certificates curl >/dev/null
    curl -fL --retry 5 --retry-delay 2 '${PYTHON_STANDALONE_URL}' -o /tmp/python-build-standalone.tar.gz
    mkdir -p /tmp/python-build-standalone
    tar -xzf /tmp/python-build-standalone.tar.gz -C /tmp/python-build-standalone
    PYTHON_BIN=\$(find /tmp/python-build-standalone -type f -path '*/bin/python3.12' | head -n1)
    if [[ -z \"\${PYTHON_BIN}\" ]]; then
      echo 'Standalone Python runtime not found after extraction.' >&2
      exit 1
    fi
    \${PYTHON_BIN} -m pip install --upgrade pip
    \${PYTHON_BIN} -m pip install -r requirements.txt
    \${PYTHON_BIN} build.py --target all --platform-id ${PLATFORM_ID}
    PLATFORM_ID=${PLATFORM_ID} bash linux/package.sh
  "

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
"${SCRIPT_DIR}/ensure-env.sh"

# Clean all processes listening on FieldForge dev ports
lsof -tiTCP:8000-8005 -tiTCP:5001-5005 -tiTCP:5173 -sTCP:LISTEN 2>/dev/null | while read -r pid; do
  if [ -n "${pid}" ]; then
    comm=$(ps -p "${pid}" -o comm= 2>/dev/null || true)
    if [[ "${comm}" != *"ControlCenter"* ]]; then
      kill -9 "${pid}" 2>/dev/null || true
    fi
  fi
done || true

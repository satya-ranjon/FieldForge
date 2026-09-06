#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 FieldForge Real-Traffic SLO Validation (k6)..."

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8000}"

if command -v k6 &> /dev/null; then
  echo "Running with local k6 installation against ${GATEWAY_URL}..."
  GATEWAY_URL="${GATEWAY_URL}" k6 run "${REPO_ROOT}/scripts/k6/dispatch-load.js"
else
  echo "Local k6 not found. Running via Docker (grafana/k6)..."
  docker run --rm -i \
    --network host \
    -e GATEWAY_URL="${GATEWAY_URL}" \
    grafana/k6:latest run - < "${REPO_ROOT}/scripts/k6/dispatch-load.js"
fi

echo "✅ SLO Validation Run Completed."

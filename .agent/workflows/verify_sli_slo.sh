#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
cd "${PROJECT_ROOT}"

if [ "${1:-}" = "--simulate" ]; then
  echo "Running synthetic sample generation only. This is not SLO verification."
  node scripts/simulate-dispatch-load.js
  exit 0
fi

echo "No evidence-producing SLO verification harness is implemented yet."
echo "Use --simulate only for UI/demo data; do not report it as a measured result."
exit 1

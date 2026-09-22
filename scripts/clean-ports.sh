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

# Verify that backing services (MySQL :3306, RabbitMQ :5672, Redis :6379) are reachable
check_port() {
  local port="$1"
  nc -z -w 1 127.0.0.1 "${port}" >/dev/null 2>&1
}

if ! check_port 3306 || ! check_port 5672 || ! check_port 6379; then
  if command -v docker >/dev/null 2>&1; then
    echo "🐳 Backing services (MySQL :3306, RabbitMQ :5672, Redis :6379) not ready. Starting infrastructure..."
    "${SCRIPT_DIR}/docker-up.sh"
  else
    echo "⚠️ Warning: Backing services on ports 3306 (MySQL), 5672 (RabbitMQ), or 6379 (Redis) are not reachable."
    echo "Please ensure Docker is installed and start backing services with: pnpm docker:up"
  fi
fi


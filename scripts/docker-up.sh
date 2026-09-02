#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# If .env does not exist, run the full bootstrap script first
if [ ! -f .env ]; then
  ./scripts/setup-dev.sh
  exit 0
fi

# Ensure Docker daemon is running
"${SCRIPT_DIR}/ensure-docker.sh"

echo "🐳 Starting FieldForge backing infrastructure..."
docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.observability.yml up -d --wait
echo "✅ FieldForge infrastructure is up and healthy."

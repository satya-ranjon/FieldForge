#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-}"

if [ -z "$SERVICE_NAME" ]; then
  echo "Usage: ./generate_microservice.sh <service-name>"
  exit 1
fi

TARGET_DIR="apps/${SERVICE_NAME}"

echo "🚀 Generating new microservice: ${SERVICE_NAME} in ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}/src/modules" "${TARGET_DIR}/test"
echo "✅ Microservice scaffold ready."

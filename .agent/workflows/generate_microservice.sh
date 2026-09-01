#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-}"

if [ -z "$SERVICE_NAME" ]; then
  echo "Usage: ./generate_microservice.sh <service-name>"
  exit 1
fi

if [[ ! "${SERVICE_NAME}" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Service names must use lowercase kebab-case."
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
TARGET_DIR="${PROJECT_ROOT}/apps/${SERVICE_NAME}"

if [ -e "${TARGET_DIR}" ]; then
  echo "Refusing to overwrite existing path: ${TARGET_DIR}"
  exit 1
fi

echo "Creating a directory skeleton for ${SERVICE_NAME} in ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}/src/modules" "${TARGET_DIR}/test"
echo "Skeleton created. Add package metadata, NestJS bootstrap, ownership, and tests before use."

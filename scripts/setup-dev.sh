#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "Bootstrapping the FieldForge local development environment..."

command -v node >/dev/null 2>&1 || { echo "Node.js 24 is required."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Enable Corepack or install pnpm 11."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker with Compose v2 is required."; exit 1; }

NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
if [ "${NODE_MAJOR}" != "24" ]; then
  echo "FieldForge requires Node.js 24; found $(node --version)."
  echo "Use your version manager to activate the version in .nvmrc."
  exit 1
fi

docker compose version >/dev/null
"${SCRIPT_DIR}/ensure-docker.sh"

"${SCRIPT_DIR}/ensure-env.sh"

echo "Installing monorepo dependencies from the frozen lockfile..."
pnpm install --frozen-lockfile

echo "Validating and starting local backing services..."
pnpm infra:config
pnpm docker:up

echo "FieldForge backing services are ready."
echo "Run database migrations explicitly with: pnpm db:migrate"
echo "Then start applications with: pnpm dev"

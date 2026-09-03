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

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from development-only placeholders in .env.example."
fi

# JWT_SECRET ships blank in .env.example and has no in-code fallback, so a fresh
# .env would leave api-gateway and auth-service refusing to start. Mint a unique
# local key rather than shipping a shared one everybody inherits.
if ! grep -qE '^JWT_SECRET=.+$' .env; then
  FF_JWT_SECRET="$(node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))")"
  # Rewrite in place without a sed -i portability split between GNU and BSD.
  node -e "
    const fs = require('node:fs');
    const s = fs.readFileSync('.env', 'utf8');
    fs.writeFileSync('.env', s.replace(/^JWT_SECRET=.*\$/m, 'JWT_SECRET=' + process.argv[1]));
  " "${FF_JWT_SECRET}"
  echo "Generated a local JWT_SECRET in .env (not committed; local development only)."
fi

echo "Installing monorepo dependencies from the frozen lockfile..."
pnpm install --frozen-lockfile

echo "Validating and starting local backing services..."
pnpm infra:config
pnpm docker:up

echo "FieldForge backing services are ready."
echo "Run database migrations explicitly with: pnpm db:migrate"
echo "Then start applications with: pnpm dev"

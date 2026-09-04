#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from development-only placeholders in .env.example."
fi

# JWT_SECRET ships blank in .env.example and has no in-code fallback, so a fresh
# .env would leave api-gateway and auth-service refusing to start. Mint a unique
# local key rather than shipping a shared one everybody inherits.
if ! grep -qE '^JWT_SECRET=.+$' .env; then
  FF_JWT_SECRET="$(node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))")"
  node -e "
    const fs = require('node:fs');
    const s = fs.readFileSync('.env', 'utf8');
    if (/^JWT_SECRET=/m.test(s)) {
      fs.writeFileSync('.env', s.replace(/^JWT_SECRET=.*$/m, 'JWT_SECRET=' + process.argv[1]));
    } else {
      fs.writeFileSync('.env', s + '\nJWT_SECRET=' + process.argv[1] + '\n');
    }
  " "${FF_JWT_SECRET}"
  echo "Generated a local JWT_SECRET in .env (not committed; local development only)."
fi

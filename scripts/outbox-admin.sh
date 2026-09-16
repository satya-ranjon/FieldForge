#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

node --no-warnings --experimental-strip-types "${SCRIPT_DIR}/outbox-admin.ts" "$@"

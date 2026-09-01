#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel)"
cd "${REPOSITORY_ROOT}"

command -v node >/dev/null 2>&1 || { echo "Node.js 24 is required."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required."; exit 1; }

NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
if [ "${NODE_MAJOR}" != "24" ]; then
  echo "FieldForge requires Node.js 24; found $(node --version)."
  exit 1
fi

GENERATED_PATHS=(
  ".turbo"
  "packages/common/dist"
  "packages/contracts/dist"
  "packages/database/dist"
  "packages/ui/dist"
  "apps/api-gateway/dist"
  "apps/auth-service/dist"
  "apps/billing-service/dist"
  "apps/dispatch-matching-service/dist"
  "apps/notification-service/dist"
  "apps/work-order-service/dist"
  "apps/web-buyer-portal/dist"
)

# An explicit template keeps this on TMPDIR. BSD mktemp defaults to the Darwin
# per-user temp directory and ignores TMPDIR entirely unless it is given one, so
# the bare `mktemp -d` fails wherever that directory is not writable.
VALIDATION_BACKUP="$(mktemp -d "${TMPDIR:-/tmp}/fieldforge-clean-typecheck.XXXXXX")"
PRIOR_OUTPUTS="${VALIDATION_BACKUP}/prior"
NEW_OUTPUTS="${VALIDATION_BACKUP}/generated"
mkdir -p "${PRIOR_OUTPUTS}" "${NEW_OUTPUTS}"

restore_outputs() {
  local generated_path backup_name target_path

  for generated_path in "${GENERATED_PATHS[@]}"; do
    backup_name="${generated_path//\//__}"
    target_path="${REPOSITORY_ROOT}/${generated_path}"

    if [ -e "${target_path}" ]; then
      mv "${target_path}" "${NEW_OUTPUTS}/${backup_name}"
    fi

    if [ -e "${PRIOR_OUTPUTS}/${backup_name}" ]; then
      mkdir -p "$(dirname -- "${target_path}")"
      mv "${PRIOR_OUTPUTS}/${backup_name}" "${target_path}"
    fi
  done

  echo "Prior generated outputs restored. Temporary validation outputs: ${NEW_OUTPUTS}"
}
trap restore_outputs EXIT

for generated_path in "${GENERATED_PATHS[@]}"; do
  backup_name="${generated_path//\//__}"
  target_path="${REPOSITORY_ROOT}/${generated_path}"

  if [ -e "${target_path}" ]; then
    mv "${target_path}" "${PRIOR_OUTPUTS}/${backup_name}"
  fi
done

echo "Running FieldForge type checking without prior dist outputs or Turbo cache..."
pnpm typecheck --force

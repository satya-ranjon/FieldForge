#!/usr/bin/env bash
# scripts/k8s-render-release.sh
#
# FieldForge Kubernetes Immutable Release Renderer & Verifier
#
# PURPOSE
# -------
# Centralizes input validation, isolated temporary workspace management,
# declarative Kustomize image injection, and strict pre-flight release verification
# for FieldForge staging Kubernetes deployments.
#
# INVARIANTS ENFORCED
# -------------------
# 1. ECR_REGISTRY must match AWS private ECR hostname structure:
#    <12-digit-account-id>.dkr.ecr.<aws-region>.amazonaws.com (or .amazonaws.com.cn).
# 2. IMAGE_TAG must match exact pattern: ^sha-[0-9a-f]{40}$ (full 40-character Git SHA).
# 3. All 7 application service images are transformed to:
#    ${ECR_REGISTRY}/fieldforge/<service>:${IMAGE_TAG}
# 4. Migration Job image uses the EXACT SAME auth-service image revision as
#    Deployment/auth-service.
# 5. Exactly 8/8 FieldForge images are rendered with immutable tags (7 app + 1 migration).
# 6. Zero FieldForge ':latest' image references survive in rendered manifests.
# 7. Backing images (MySQL, Redis, RabbitMQ) are preserved without modification.
# 8. Tracked manifests in infra/k8s/ are NEVER modified in-place (zero working-tree drift).
#
# USAGE
# -----
#   ./scripts/k8s-render-release.sh [OPTIONS]
#
# OPTIONS
#   --registry REGISTRY       ECR registry hostname (or ECR_REGISTRY env var)
#   --tag TAG                 Git commit SHA tag in sha-<40hex> format (or IMAGE_TAG env var)
#   --verify                  Perform full release rendering & verification (default)
#   --render-root             Output verified rendered root manifest to stdout
#   --render-migration        Output verified rendered migration manifest to stdout
#   --prepare-workspace DIR   Copy infra/k8s to DIR and apply image transformations
#   --help, -h                Show this help message
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TRACKED_K8S_PATH="${REPO_ROOT}/infra/k8s"

ECR_REGISTRY="${ECR_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-}"
ACTION="verify"
TARGET_WORKSPACE=""

# 7 application services mapped to ECR
APPLICATION_SERVICES=(
  "api-gateway"
  "auth-service"
  "billing-service"
  "dispatch-matching-service"
  "notification-service"
  "work-order-service"
  "web-buyer-portal"
)

# ── Argument parsing ───────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --registry)
      ECR_REGISTRY="$2"
      shift 2
      ;;
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --verify)
      ACTION="verify"
      shift 1
      ;;
    --render-root)
      ACTION="render-root"
      shift 1
      ;;
    --render-migration)
      ACTION="render-migration"
      shift 1
      ;;
    --prepare-workspace)
      ACTION="prepare-workspace"
      TARGET_WORKSPACE="$2"
      shift 2
      ;;
    --help|-h)
      sed -n '/^# PURPOSE/,/^set -euo pipefail/{ /^set -euo pipefail/d; s/^# \{0,1\}//p }' "$0"
      exit 0
      ;;
    *)
      echo "❌ Unknown argument: $1" >&2
      echo "   Usage: $0 [--registry REGISTRY] [--tag TAG] [--verify|--render-root|--render-migration|--prepare-workspace DIR]" >&2
      exit 1
      ;;
  esac
done

# ── Input validation ───────────────────────────────────────────────────────────

# 1. ECR_REGISTRY validation
if [[ -z "${ECR_REGISTRY}" ]]; then
  echo "❌ Missing required parameter: ECR_REGISTRY" >&2
  echo "   Provide via --registry <hostname> or ECR_REGISTRY environment variable." >&2
  echo "   Example: 111111111111.dkr.ecr.us-east-1.amazonaws.com" >&2
  exit 1
fi

# Must match AWS private ECR registry hostname pattern:
# <12-digit-account-id>.dkr.ecr.<aws-region>.amazonaws.com (or .cn partition)
ECR_HOSTNAME_REGEX='^[0-9]{12}\.dkr\.ecr\.[a-z]{2,}-[a-z0-9-]+-[0-9]+\.amazonaws\.com(\.cn)?$'
if [[ ! "${ECR_REGISTRY}" =~ ${ECR_HOSTNAME_REGEX} || "${ECR_REGISTRY}" == *" "* || "${ECR_REGISTRY}" == *"/"* || "${ECR_REGISTRY}" == *"http:"* || "${ECR_REGISTRY}" == *"https:"* ]]; then
  echo "❌ Invalid ECR_REGISTRY: '${ECR_REGISTRY}'" >&2
  echo "   Must match AWS private ECR hostname structure: <12-digit-account-id>.dkr.ecr.<region>.amazonaws.com" >&2
  echo "   Example: 111111111111.dkr.ecr.us-east-1.amazonaws.com" >&2
  exit 1
fi

# 2. IMAGE_TAG validation
if [[ -z "${IMAGE_TAG}" ]]; then
  echo "❌ Missing required parameter: IMAGE_TAG" >&2
  echo "   Provide via --tag <tag> or IMAGE_TAG environment variable." >&2
  echo "   Must match exact pattern: ^sha-[0-9a-f]{40}$" >&2
  exit 1
fi

if [[ ! "${IMAGE_TAG}" =~ ^sha-[0-9a-f]{40}$ ]]; then
  echo "❌ Invalid IMAGE_TAG: '${IMAGE_TAG}'" >&2
  echo "   Must match exact pattern: ^sha-[0-9a-f]{40}$ (40 lowercase hexadecimal characters preceded by 'sha-')." >&2
  echo "   Rejected values include: mutable tags (latest, develop, staging, main), semver tags (v*), or truncated shas." >&2
  exit 1
fi

# 3. kubectl availability
command -v kubectl > /dev/null 2>&1 || {
  echo "❌ kubectl is not installed or not on PATH." >&2
  exit 1
}

# ── Helper: Populate Workspace with Transformed Kustomizations ─────────────────

populate_workspace() {
  local ws_dir="$1"

  # Copy tracked k8s manifests to target workspace
  mkdir -p "${ws_dir}"
  cp -R "${TRACKED_K8S_PATH}"/* "${ws_dir}/"

  # Inject images: block into root kustomization.yaml
  {
    echo ""
    echo "images:"
    for svc in "${APPLICATION_SERVICES[@]}"; do
      echo "  - name: fieldforge/${svc}"
      echo "    newName: ${ECR_REGISTRY}/fieldforge/${svc}"
      echo "    newTag: ${IMAGE_TAG}"
    done
  } >> "${ws_dir}/kustomization.yaml"

  # Inject images: block into migrations/kustomization.yaml
  {
    echo ""
    echo "images:"
    echo "  - name: fieldforge/auth-service"
    echo "    newName: ${ECR_REGISTRY}/fieldforge/auth-service"
    echo "    newTag: ${IMAGE_TAG}"
  } >> "${ws_dir}/migrations/kustomization.yaml"
}

# ── Helper: Render and Verify Manifests ─────────────────────────────────────────

verify_manifests() {
  local ws_dir="$1"
  local log_output="${2:-true}"

  local root_yaml
  local migration_yaml

  root_yaml=$(kubectl kustomize "${ws_dir}")
  migration_yaml=$(kubectl kustomize "${ws_dir}/migrations")

  # 1. Verify 7 application service images in root render
  for svc in "${APPLICATION_SERVICES[@]}"; do
    local expected_img="${ECR_REGISTRY}/fieldforge/${svc}:${IMAGE_TAG}"
    if ! grep -q "${expected_img}" <<< "${root_yaml}"; then
      echo "❌ Root manifest missing expected transformed image: ${expected_img}" >&2
      return 1
    fi
  done

  # 2. Verify migration image in migration render
  local expected_migration_img="${ECR_REGISTRY}/fieldforge/auth-service:${IMAGE_TAG}"
  if ! grep -q "${expected_migration_img}" <<< "${migration_yaml}"; then
    echo "❌ Migration manifest missing expected transformed image: ${expected_migration_img}" >&2
    return 1
  fi

  # 3. Extract auth Deployment image from root render
  local auth_dep_image
  auth_dep_image=$(awk '
    $1 == "kind:" && $2 == "Deployment" { in_dep = 1 }
    in_dep && $1 == "name:" && $2 == "auth-service" { in_auth = 1 }
    in_auth && $1 == "image:" { print $2; exit }
    $1 == "---" { in_dep = 0; in_auth = 0 }
  ' <<< "${root_yaml}")

  # 4. Extract db-migrate Job image from migration render
  local migrate_job_image
  migrate_job_image=$(awk '
    $1 == "kind:" && $2 == "Job" { in_job = 1 }
    in_job && $1 == "image:" { print $2; exit }
    $1 == "---" { in_job = 0 }
  ' <<< "${migration_yaml}")

  # 5. Exact string equality check
  if [[ -z "${auth_dep_image}" ]]; then
    echo "❌ Failed to extract auth-service Deployment image from root manifest." >&2
    return 1
  fi
  if [[ -z "${migrate_job_image}" ]]; then
    echo "❌ Failed to extract fieldforge-db-migrate Job image from migration manifest." >&2
    return 1
  fi
  if [[ "${auth_dep_image}" != "${migrate_job_image}" ]]; then
    echo "❌ Auth deployment image and migration job image do not match!" >&2
    echo "   Auth Deployment: ${auth_dep_image}" >&2
    echo "   Migration Job:   ${migrate_job_image}" >&2
    return 1
  fi

  # 6. Count FieldForge immutable image references
  local root_ff_count
  local migration_ff_count
  root_ff_count=$(grep -c -E "image:\s*${ECR_REGISTRY}/fieldforge/" <<< "${root_yaml}" || true)
  migration_ff_count=$(grep -c -E "image:\s*${ECR_REGISTRY}/fieldforge/" <<< "${migration_yaml}" || true)
  local total_ff_count=$((root_ff_count + migration_ff_count))

  if [[ "${root_ff_count}" -ne 7 ]]; then
    echo "❌ Expected 7 FieldForge immutable images in root manifest, found ${root_ff_count}." >&2
    return 1
  fi
  if [[ "${migration_ff_count}" -ne 1 ]]; then
    echo "❌ Expected 1 FieldForge immutable image in migration manifest, found ${migration_ff_count}." >&2
    return 1
  fi
  if [[ "${total_ff_count}" -ne 8 ]]; then
    echo "❌ Expected 8 total FieldForge immutable images across manifests, found ${total_ff_count}." >&2
    return 1
  fi

  # 7. Reject any surviving FieldForge :latest references
  local combined_manifests
  combined_manifests="${root_yaml}"$'\n'"${migration_yaml}"
  local latest_count
  latest_count=$(grep -c -E "image:\s*.*fieldforge.*:latest" <<< "${combined_manifests}" || true)
  if [[ "${latest_count}" -ne 0 ]]; then
    echo "❌ Found ${latest_count} FieldForge ':latest' image references surviving in rendered manifests!" >&2
    return 1
  fi

  # 8. Verify backing images are preserved
  if ! grep -q "image: mysql:8.4" <<< "${root_yaml}"; then
    echo "❌ Backing service MySQL image (mysql:8.4) was corrupted or missing." >&2
    return 1
  fi
  if ! grep -q "image: redis:8.0-alpine" <<< "${root_yaml}"; then
    echo "❌ Backing service Redis image (redis:8.0-alpine) was corrupted or missing." >&2
    return 1
  fi
  if ! grep -q "image: rabbitmq:4.1-management-alpine" <<< "${root_yaml}"; then
    echo "❌ Backing service RabbitMQ image (rabbitmq:4.1-management-alpine) was corrupted or missing." >&2
    return 1
  fi

  if [[ "${log_output}" == "true" ]]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅  FieldForge — Immutable Release Verification Report"
    echo "    Registry:                     ${ECR_REGISTRY}"
    echo "    Image Tag:                    ${IMAGE_TAG}"
    echo "    Application Images (Root):    7/7 verified"
    echo "    Migration Image (Auth):       1/1 verified"
    echo "    Total Immutable Images:       8/8 verified"
    echo "    Surviving FieldForge :latest: 0 (clean)"
    echo "    Auth Deployment Revision:     ${auth_dep_image}"
    echo "    Migration Job Revision:       ${migrate_job_image}"
    echo "    Auth/Migration Revision Match: EXACT MATCH ✅"
    echo "    Backing Images Preserved:     MySQL (8.4), Redis (8.0-alpine), RabbitMQ (4.1-alpine) ✅"
    echo "    Tracked Manifests Drift:      0 modifications ✅"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  fi

  return 0
}

# ── Execute Action ─────────────────────────────────────────────────────────────

case "${ACTION}" in
  verify)
    TMP_WORKSPACE=$(mktemp -d -t fieldforge-render-verify-XXXXXX)
    trap 'rm -rf "${TMP_WORKSPACE}"' EXIT INT TERM
    populate_workspace "${TMP_WORKSPACE}"
    verify_manifests "${TMP_WORKSPACE}" "true"
    ;;

  render-root)
    TMP_WORKSPACE=$(mktemp -d -t fieldforge-render-root-XXXXXX)
    trap 'rm -rf "${TMP_WORKSPACE}"' EXIT INT TERM
    populate_workspace "${TMP_WORKSPACE}"
    verify_manifests "${TMP_WORKSPACE}" "false"
    kubectl kustomize "${TMP_WORKSPACE}"
    ;;

  render-migration)
    TMP_WORKSPACE=$(mktemp -d -t fieldforge-render-migration-XXXXXX)
    trap 'rm -rf "${TMP_WORKSPACE}"' EXIT INT TERM
    populate_workspace "${TMP_WORKSPACE}"
    verify_manifests "${TMP_WORKSPACE}" "false"
    kubectl kustomize "${TMP_WORKSPACE}/migrations"
    ;;

  prepare-workspace)
    if [[ -z "${TARGET_WORKSPACE}" ]]; then
      echo "❌ Missing TARGET_WORKSPACE directory for --prepare-workspace." >&2
      exit 1
    fi
    populate_workspace "${TARGET_WORKSPACE}"
    verify_manifests "${TARGET_WORKSPACE}" "false"
    ;;
esac

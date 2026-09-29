#!/usr/bin/env bash
# scripts/k8s-run-db-migration.sh
#
# FieldForge Kubernetes Database Migration Runner
#
# PURPOSE
# -------
# Executes the Drizzle schema migration Job (fieldforge-db-migrate) against an
# active Kubernetes cluster. Implements explicit delete → apply → wait semantics
# that guarantee a fresh Job execution on every invocation — regardless of whether
# a completed or failed Job from a previous run still exists in the cluster.
#
## USAGE
# -----
#   ./scripts/k8s-run-db-migration.sh [--timeout SECONDS] [--namespace NAMESPACE] [--registry ECR_REGISTRY] [--tag IMAGE_TAG]
#
# OPTIONS
#   --timeout SECONDS      kubectl wait timeout in seconds (default: 120)
#   --namespace NAMESPACE  Kubernetes namespace (default: default)
#   --registry REGISTRY    ECR registry hostname (or ECR_REGISTRY env var)
#   --tag TAG              Git commit SHA tag in sha-<40hex> format (or IMAGE_TAG env var)
#
# DEPLOYMENT ORDERING CONTRACT
# ----------------------------
# This script is called by the authoritative staging deployment orchestrator:
#
#   ./scripts/k8s-deploy-staging.sh
#
# Do NOT invoke this script manually as a standalone deployment step using the
# old two-pass pattern below — that pattern submits application Deployments
# before migration completes:
#
#   ❌ WRONG (old pattern — DO NOT USE):
#      kubectl apply -k infra/k8s          ← includes application Deployments
#      ./scripts/k8s-run-db-migration.sh
#      kubectl apply -k infra/k8s
#
# The correct sequence (enforced by k8s-deploy-staging.sh):
#   1. Apply ConfigMap + backing infra only (no application Deployments)
#   2. Wait for backing readiness
#   3. This script (migration runner)          ← current script
#   4. Apply full platform (with immutable images) ← only if migration succeeds
#   5. Verify application rollouts
#

# PREREQUISITES
# -------------
# The following must already exist in the cluster before running this script:
#   - ConfigMap:   fieldforge-global-config  (DB_HOST, DB_PORT, DB_NAME, DB_USER)
#   - Secret:      fieldforge-secrets        (DB_PASSWORD — not printed by this script)
#   - StatefulSet: mysql                     (pod labeled app=mysql, service mysql-service:3306)
#
# This script verifies that fieldforge-secrets exists (existence check only — no contents printed).
#
# REPEAT-RUN SEMANTICS
# --------------------
# Scenario A — No prior Job exists:
#   → runner creates Job → migrations execute → Job completes.
#
# Scenario B — Prior completed Job still present (within TTL window):
#   → runner deletes old Job → creates fresh Job → migrations re-execute → idempotent no-op
#     for previously applied migrations → new migrations apply if present.
#
# Scenario C — Prior failed Job still present:
#   → runner deletes failed Job → creates fresh Job → migrations execute.
#
# DRIZZLE RE-RUN SAFETY
# ---------------------
# drizzle-kit migrate is idempotent. Applied migrations are recorded in the
# __drizzle_migrations table inside MySQL. Re-running the command is always safe:
# previously applied migrations are skipped; only new migrations are executed.
#
# TTL SEMANTICS
# -------------
# ttlSecondsAfterFinished: 600 in the Job spec provides passive garbage collection
# of completed/failed Job objects after 10 minutes. This is housekeeping only.
# Repeat execution depends on this runner's explicit delete/recreate — not TTL.
#
# IMMUTABLE IMAGE REVISION CONTRACT (H8-D1.6D)
# --------------------------------------------
# The migration Job uses ${ECR_REGISTRY}/fieldforge/auth-service:${IMAGE_TAG}.
# It is guaranteed to match the exact revision of Deployment/auth-service via
# scripts/k8s-render-release.sh. Mutated manifests are isolated in a temporary
# workspace; tracked manifests in infra/k8s/ are never modified.
#
# ISOLATION GUARANTEES
# --------------------
# The migration Job is independent of Redis, RabbitMQ, S3, and all HTTP services.
# Only MySQL is required.
#
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
RENDER_HELPER="${SCRIPT_DIR}/k8s-render-release.sh"

JOB_NAME="fieldforge-db-migrate"
REQUIRED_SECRET="fieldforge-secrets"
MYSQL_POD_LABEL="app=mysql"

TIMEOUT_SECONDS=120
NAMESPACE="default"
ECR_REGISTRY="${ECR_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-}"

# ── Argument parsing ───────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      TIMEOUT_SECONDS="$2"
      shift 2
      ;;
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --registry)
      ECR_REGISTRY="$2"
      shift 2
      ;;
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --help|-h)
      sed -n '/^# PURPOSE/,/^set -euo pipefail/{ /^set -euo pipefail/d; s/^# \{0,1\}//p }' "$0"
      exit 0
      ;;
    *)
      echo "❌ Unknown argument: $1" >&2
      echo "   Usage: $0 [--timeout SECONDS] [--namespace NAMESPACE] [--registry ECR_REGISTRY] [--tag IMAGE_TAG]" >&2
      exit 1
      ;;
  esac
done

NS_FLAG="--namespace=${NAMESPACE}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄  FieldForge — Kubernetes Database Migration"
echo "    Job:       ${JOB_NAME}"
echo "    Namespace: ${NAMESPACE}"
echo "    Timeout:   ${TIMEOUT_SECONDS}s"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 0: Pre-flight validation ─────────────────────────────────────────────

echo ""
echo "🔍 Checking kubectl availability..."
command -v kubectl > /dev/null 2>&1 || {
  echo "❌ kubectl is not installed or not on PATH. Cannot run migration." >&2
  exit 1
}
echo "   ✅ kubectl found: $(kubectl version --client --short 2>/dev/null || kubectl version --client 2>/dev/null | head -1)"

echo ""
echo "🔍 Validating immutable release contract..."
if [[ ! -x "${RENDER_HELPER}" ]]; then
  echo "❌ Release render helper not found or not executable at: ${RENDER_HELPER}" >&2
  exit 1
fi

"${RENDER_HELPER}" \
  --registry "${ECR_REGISTRY}" \
  --tag "${IMAGE_TAG}" \
  --verify > /dev/null
echo "   ✅ Release contract verified: ${ECR_REGISTRY}/fieldforge/auth-service:${IMAGE_TAG}"

# ── Step 1: Secret existence check ────────────────────────────────────────────

echo ""
echo "🔒 Verifying required Secret '${REQUIRED_SECRET}' exists..."
if ! kubectl get secret "${REQUIRED_SECRET}" ${NS_FLAG} > /dev/null 2>&1; then
  echo "" >&2
  echo "❌ Secret '${REQUIRED_SECRET}' does not exist in namespace '${NAMESPACE}'." >&2
  echo "" >&2
  echo "   Create it from the template before running migrations:" >&2
  echo "   kubectl create secret generic ${REQUIRED_SECRET} \\" >&2
  echo "     --from-literal=DB_PASSWORD='<secure-value>' \\" >&2
  echo "     --from-literal=JWT_SECRET='<secure-value>' \\" >&2
  echo "     --from-literal=INTERNAL_SERVICE_SECRET='<secure-value>' \\" >&2
  echo "     --from-literal=RABBITMQ_PASSWORD='<secure-value>' \\" >&2
  echo "     --from-literal=REDIS_PASSWORD='<secure-value>' \\" >&2
  echo "     --namespace=${NAMESPACE}" >&2
  echo "" >&2
  echo "   See: infra/k8s/base/secrets.example.yaml for required keys." >&2
  exit 1
fi
echo "   ✅ Secret '${REQUIRED_SECRET}' exists (contents not inspected)."

# ── Step 2: MySQL pod readiness ───────────────────────────────────────────────

echo ""
echo "🗄️  Waiting for MySQL pod (label: ${MYSQL_POD_LABEL}) to be Ready..."
echo "   Timeout: ${TIMEOUT_SECONDS}s"
if ! kubectl wait \
    --for=condition=ready \
    pod \
    -l "${MYSQL_POD_LABEL}" \
    ${NS_FLAG} \
    --timeout="${TIMEOUT_SECONDS}s"; then
  echo "" >&2
  echo "❌ MySQL pod did not become Ready within ${TIMEOUT_SECONDS}s." >&2
  echo "" >&2
  echo "   Diagnostics (no secrets printed):" >&2
  kubectl get pods -l "${MYSQL_POD_LABEL}" ${NS_FLAG} 2>&1 | grep -v "PASSWORD\|SECRET\|password\|secret" >&2 || true
  echo "" >&2
  echo "   Check MySQL StatefulSet status and events for root cause." >&2
  exit 1
fi
echo "   ✅ MySQL pod is Ready."

# ── Step 3: Delete any existing Job (explicit repeatable lifecycle) ────────────

echo ""
echo "🗑️  Removing any existing Job '${JOB_NAME}' (if present)..."
# --wait=true: blocks until the Job object and its pods are fully removed.
# This prevents the subsequent apply from conflicting with an immutable spec.
kubectl delete job "${JOB_NAME}" \
  ${NS_FLAG} \
  --ignore-not-found=true \
  --wait=true
echo "   ✅ Job '${JOB_NAME}' cleared (or was not present)."

# ── Step 4: Apply the migration Kustomization ─────────────────────────────────

echo ""
echo "🚀 Applying immutable migration Kustomization..."
TMP_MIGRATE_WORKSPACE=$(mktemp -d -t fieldforge-migrate-XXXXXX)
trap 'rm -rf "${TMP_MIGRATE_WORKSPACE}"' EXIT INT TERM
"${RENDER_HELPER}" \
  --registry "${ECR_REGISTRY}" \
  --tag "${IMAGE_TAG}" \
  --prepare-workspace "${TMP_MIGRATE_WORKSPACE}"
kubectl apply -k "${TMP_MIGRATE_WORKSPACE}/migrations" ${NS_FLAG}
echo "   ✅ Job '${JOB_NAME}' created."

# ── Step 5: Wait for Job completion ───────────────────────────────────────────

echo ""
echo "⏳ Waiting for Job '${JOB_NAME}' to complete (timeout: ${TIMEOUT_SECONDS}s)..."
if kubectl wait \
    --for=condition=complete \
    job/"${JOB_NAME}" \
    ${NS_FLAG} \
    --timeout="${TIMEOUT_SECONDS}s"; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅  FieldForge database migration completed successfully."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi

# ── Failure path ──────────────────────────────────────────────────────────────

echo "" >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "❌  Migration Job '${JOB_NAME}' failed or timed out." >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "" >&2
echo "--- Job description (no secrets printed) ---" >&2
kubectl describe job "${JOB_NAME}" ${NS_FLAG} 2>&1 \
  | grep -v "PASSWORD\|SECRET\|password\|secret" >&2 || true
echo "" >&2
echo "--- Migration container logs ---" >&2
kubectl logs "job/${JOB_NAME}" ${NS_FLAG} 2>&1 \
  | grep -v "PASSWORD\|SECRET\|password\|secret" >&2 || true
echo "" >&2
echo "   Fix the migration error and re-run: ./scripts/k8s-run-db-migration.sh" >&2
echo "   DO NOT apply application Deployments until migrations succeed." >&2
exit 1

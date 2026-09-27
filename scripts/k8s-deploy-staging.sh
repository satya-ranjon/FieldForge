#!/usr/bin/env bash
# scripts/k8s-deploy-staging.sh
#
# FieldForge Staging Deployment Orchestrator
#
# PURPOSE
# -------
# The authoritative deployment procedure for the FieldForge staging Kubernetes
# cluster. Enforces a strict sequential pipeline that guarantees:
#
#   backing infrastructure
#         ↓
#   backing readiness
#         ↓
#   database migration (via scripts/k8s-run-db-migration.sh)
#         ↓
#   migration SUCCESS confirmed
#         ↓
#   application Deployments submitted
#         ↓
#   rollout verified
#
# CRITICAL INVARIANT
# ------------------
# Application Deployments are NEVER submitted before migration success.
# If ANY step fails, the script exits non-zero and downstream steps do not run.
# This is structurally guaranteed by `set -euo pipefail` and the explicit
# sequencing below — NOT by kubectl ordering or TTL semantics.
#
# USAGE
# -----
#   ./scripts/k8s-deploy-staging.sh [--timeout SECONDS] [--namespace NAMESPACE]
#
# OPTIONS
#   --timeout SECONDS      Per-step kubectl wait timeout in seconds (default: 180)
#   --namespace NAMESPACE  Kubernetes namespace (default: default)
#
# DO NOT USE:
#   kubectl apply -k infra/k8s
# directly as the deployment command. That submits application Deployments
# concurrently with backing infrastructure, without migration.
#
# WHAT THIS SCRIPT APPLIES IN ORDER
# ----------------------------------
# Step 3 — Prerequisites (no application Deployments):
#   infra/k8s/base/configmap.yaml      → fieldforge-global-config ConfigMap
#   infra/k8s/backing/mysql.yaml       → MySQL StatefulSet + Service
#   infra/k8s/backing/redis.yaml       → Redis StatefulSets + Services
#   infra/k8s/backing/rabbitmq.yaml    → RabbitMQ StatefulSet + Services
#
# Step 4 — Backing readiness:
#   kubectl wait --for=condition=ready pod -l app=mysql
#   kubectl wait --for=condition=ready pod -l app=redis
#   kubectl wait --for=condition=ready pod -l app=rabbitmq
#
# Step 5 — Migration (delegates entirely to k8s-run-db-migration.sh):
#   scripts/k8s-run-db-migration.sh --timeout N --namespace NS
#
# Step 6 — Full platform apply (only runs if Step 5 succeeds):
#   kubectl apply -k infra/k8s
#   (ConfigMap, backing, Ingress, all 6 service Deployments — idempotent)
#
# Step 7 — Application rollout verification:
#   kubectl rollout status deployment/<name> for all 6 services
#
# REPEAT DEPLOYMENT BEHAVIOR
# --------------------------
# Deployment A (fresh cluster):
#   apply prerequisites → backing ready → migrate → apps → DONE
#
# Deployment B (re-deploy, within TTL window of prior migration Job):
#   re-apply prerequisites (idempotent) → backing still ready →
#   migration runner deletes old Job → fresh Job → Drizzle skips old
#   migrations + applies new ones → apps updated → DONE
#
# Migration failure:
#   prerequisites applied → migration fails → script exits non-zero →
#   application Deployments NEVER submitted
#
# OLD-REVISION CAVEAT
# -------------------
# On an update deployment, any application pods from the PRIOR revision may
# remain running while the migration Job executes. This is the standard
# rolling-update window. FieldForge migrations are designed to be
# backward-compatible with the previous application revision (additive only
# in existing migrations 0000-0007). New application revision does NOT roll
# out until migration succeeds. This is documented but not enforce-contracted
# at the Drizzle schema level; schema expand/contract strategy is H8-D+ work.
#
# H8-D BOUNDARY
# -------------
# This script does not handle:
#   - Real cluster authentication / kubeconfig provisioning
#   - Immutable image revision tagging (currently :latest)
#   - IAM / IRSA credential provisioning
#   - web-buyer-portal deployment
#   - TLS / production Ingress setup
#   - Live deployment monitoring / alerting
# All of the above are H8-D work.
#
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

MIGRATION_RUNNER="${SCRIPT_DIR}/k8s-run-db-migration.sh"
PLATFORM_KUSTOMIZE_PATH="${REPO_ROOT}/infra/k8s"

REQUIRED_SECRET="fieldforge-secrets"

# Prerequisite manifests applied BEFORE migration (no application Deployments)
PREREQUISITE_MANIFESTS=(
  "${REPO_ROOT}/infra/k8s/base/configmap.yaml"
  "${REPO_ROOT}/infra/k8s/backing/mysql.yaml"
  "${REPO_ROOT}/infra/k8s/backing/redis.yaml"
  "${REPO_ROOT}/infra/k8s/backing/rabbitmq.yaml"
)

# Backing pod labels (verified against manifests)
BACKING_LABELS=("app=mysql" "app=redis" "app=rabbitmq")
BACKING_NAMES=("MySQL" "Redis" "RabbitMQ")

# Application Deployment names (verified against infra/k8s/services/*.yaml)
APP_DEPLOYMENTS=(
  "api-gateway"
  "auth-service"
  "work-order-service"
  "dispatch-service"
  "billing-service"
  "notification-service"
)

TIMEOUT_SECONDS=180
NAMESPACE="default"

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
    --help|-h)
      sed -n '/^# PURPOSE/,/^set -euo pipefail/{ /^set -euo pipefail/d; s/^# \{0,1\}//p }' "$0"
      exit 0
      ;;
    *)
      echo "❌ Unknown argument: $1" >&2
      echo "   Usage: $0 [--timeout SECONDS] [--namespace NAMESPACE]" >&2
      exit 1
      ;;
  esac
done

NS_FLAG="--namespace=${NAMESPACE}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀  FieldForge — Staging Deployment Orchestrator"
echo "    Namespace: ${NAMESPACE}"
echo "    Timeout:   ${TIMEOUT_SECONDS}s per step"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: kubectl availability ──────────────────────────────────────────────

echo ""
echo "▶  Step 1/7 — kubectl connectivity"
command -v kubectl > /dev/null 2>&1 || {
  echo "❌ kubectl is not installed or not on PATH." >&2
  exit 1
}
echo "   ✅ kubectl found: $(kubectl version --client --short 2>/dev/null || kubectl version --client 2>/dev/null | head -1)"

echo ""
echo "   Testing cluster connectivity..."
kubectl cluster-info > /dev/null 2>&1 || {
  echo "❌ Cannot reach Kubernetes cluster. Verify kubeconfig and cluster availability." >&2
  exit 1
}
echo "   ✅ Cluster is reachable."

# ── Step 2: Secret existence check ────────────────────────────────────────────

echo ""
echo "▶  Step 2/7 — Secret precondition"
echo "   Verifying '${REQUIRED_SECRET}' exists in namespace '${NAMESPACE}'..."
if ! kubectl get secret "${REQUIRED_SECRET}" ${NS_FLAG} > /dev/null 2>&1; then
  echo "" >&2
  echo "❌ Secret '${REQUIRED_SECRET}' does not exist in namespace '${NAMESPACE}'." >&2
  echo "" >&2
  echo "   Create it before deploying:" >&2
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

# ── Step 3: Apply prerequisites only (NO application Deployments) ──────────────

echo ""
echo "▶  Step 3/7 — Apply prerequisite infrastructure (NO application Deployments)"
echo "   Applying: ConfigMap, MySQL, Redis, RabbitMQ"
echo ""
echo "   ⚠️  This step deliberately does NOT run: kubectl apply -k infra/k8s"
echo "      (root kustomize includes application Deployments; those are deferred"
echo "       until AFTER migration succeeds in Step 6)"
echo ""

for manifest in "${PREREQUISITE_MANIFESTS[@]}"; do
  echo "   → kubectl apply -f ${manifest##*/repo/} ${NS_FLAG}"
  kubectl apply -f "${manifest}" ${NS_FLAG}
done

echo ""
echo "   ✅ Prerequisite infrastructure applied."

# ── Step 4: Backing workload readiness ────────────────────────────────────────

echo ""
echo "▶  Step 4/7 — Backing workload readiness"

for i in "${!BACKING_LABELS[@]}"; do
  label="${BACKING_LABELS[$i]}"
  name="${BACKING_NAMES[$i]}"
  echo ""
  echo "   ⏳ Waiting for ${name} pod (label: ${label}) — timeout: ${TIMEOUT_SECONDS}s..."
  if ! kubectl wait \
      --for=condition=ready \
      pod \
      -l "${label}" \
      ${NS_FLAG} \
      --timeout="${TIMEOUT_SECONDS}s"; then
    echo "" >&2
    echo "❌ ${name} pod did not become Ready within ${TIMEOUT_SECONDS}s." >&2
    kubectl get pods -l "${label}" ${NS_FLAG} 2>&1 | grep -v "PASSWORD\|SECRET\|password\|secret" >&2 || true
    exit 1
  fi
  echo "   ✅ ${name} is Ready."
done

# ── Step 5: Database migration ─────────────────────────────────────────────────
# HARD BOUNDARY: application Deployments are submitted in Step 6 only if
# this step exits 0. set -euo pipefail guarantees Step 6 is unreachable on
# non-zero exit from the migration runner.

echo ""
echo "▶  Step 5/7 — Database migration"
echo "   Delegating to: scripts/k8s-run-db-migration.sh"
echo "   (delete old Job → apply fresh Job → wait for completion)"
echo ""

"${MIGRATION_RUNNER}" \
  --timeout "${TIMEOUT_SECONDS}" \
  --namespace "${NAMESPACE}"

# If the migration runner returned non-zero, set -euo pipefail
# ensures execution halts here. Step 6 (application apply) is never reached.
echo ""
echo "   ✅ Migration completed successfully. Proceeding to application rollout."

# ── Step 6: Full platform apply (application Deployments) ─────────────────────
# Only reachable after Step 5 (migration) succeeds.
# Re-applying ConfigMap and backing infrastructure is safe and idempotent.

echo ""
echo "▶  Step 6/7 — Apply full platform (application Deployments)"
echo "   kubectl apply -k ${PLATFORM_KUSTOMIZE_PATH}"
kubectl apply -k "${PLATFORM_KUSTOMIZE_PATH}" ${NS_FLAG}
echo ""
echo "   ✅ Full platform applied."

# ── Step 7: Application rollout verification ───────────────────────────────────

echo ""
echo "▶  Step 7/7 — Application rollout verification"

ROLLOUT_FAILED=0
for deployment in "${APP_DEPLOYMENTS[@]}"; do
  echo ""
  echo "   ⏳ kubectl rollout status deployment/${deployment} (timeout: ${TIMEOUT_SECONDS}s)..."
  if ! kubectl rollout status \
      "deployment/${deployment}" \
      ${NS_FLAG} \
      --timeout="${TIMEOUT_SECONDS}s"; then
    echo "   ❌ Rollout failed for deployment/${deployment}" >&2
    ROLLOUT_FAILED=1
  else
    echo "   ✅ deployment/${deployment} rolled out successfully."
  fi
done

if [ "${ROLLOUT_FAILED}" -ne 0 ]; then
  echo "" >&2
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "❌  One or more application Deployments failed to roll out." >&2
  echo "    Migrations DID succeed. Application manifests WERE applied." >&2
  echo "    Investigate failing Deployments above." >&2
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  exit 1
fi

# ── Success ────────────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  FieldForge staging deployment complete."
echo ""
echo "    Namespace:    ${NAMESPACE}"
echo "    Backing:      MySQL ✅  Redis ✅  RabbitMQ ✅"
echo "    Migrations:   Applied and verified ✅"
echo "    Applications: $(printf '%s ' "${APP_DEPLOYMENTS[@]}") ✅"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

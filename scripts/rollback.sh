#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# rollback.sh — Restore all app services to the previous deployed SHA.
#
# Reads the previous SHA from backups/.previous-sha (relative to project root), pulls the
# corresponding images from Docker Hub, restarts all three app containers, and
# runs a health check to verify the rollback succeeded.
#
# Usage: rollback.sh
#   No arguments. Reads state from .previous-sha file.
#
# Environment variables:
#   REGISTRY           — Docker Hub username (default: ${DOCKERHUB_USERNAME:-OWNER})
#                        Set DOCKERHUB_USERNAME or override REGISTRY directly.
#   DOCKERHUB_USERNAME — (optional) Docker Hub username used for login.
#   DOCKERHUB_TOKEN    — (optional) Docker Hub access token used for login.
#                        Required for standalone manual runs when images are private.
#                        When invoked from deploy.sh the login may be skipped because
#                        credentials are already cached in the shell session.
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PREVIOUS_SHA_FILE="$PROJECT_ROOT/backups/.previous-sha"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yaml"

# Determine registry base
REGISTRY="${REGISTRY:-${DOCKERHUB_USERNAME:-OWNER}}"

# ---------------------------------------------------------------------------
# Step 1: Read previous SHA
# ---------------------------------------------------------------------------
if [ ! -f "$PREVIOUS_SHA_FILE" ]; then
  echo "ERROR: No previous SHA file found at $PREVIOUS_SHA_FILE." >&2
  echo "       Cannot roll back — no previous deployment recorded." >&2
  exit 1
fi

PREV_SHA=$(cat "$PREVIOUS_SHA_FILE" | tr -d '[:space:]')

if [ -z "$PREV_SHA" ]; then
  echo "ERROR: Previous SHA file exists but is empty: $PREVIOUS_SHA_FILE" >&2
  echo "       Cannot roll back — no previous deployment recorded." >&2
  exit 1
fi

# Normalise: if the stored value already starts with "sha-", use as-is;
# otherwise construct the tag from the raw SHA.
if echo "$PREV_SHA" | grep -qE '^sha-[a-f0-9]{7}$'; then
  PREV_TAG="$PREV_SHA"
else
  PREV_TAG="sha-$(echo "$PREV_SHA" | cut -c1-7)"
fi

echo "==> Rolling back to tag: $PREV_TAG (registry: $REGISTRY)"

# ---------------------------------------------------------------------------
# Step 2: Login to Docker Hub (for standalone runs)
# ---------------------------------------------------------------------------
if [ -n "${DOCKERHUB_USERNAME:-}" ] && [ -n "${DOCKERHUB_TOKEN:-}" ]; then
  echo "==> Logging in to Docker Hub..."
  echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
else
  echo "==> DOCKERHUB_USERNAME/DOCKERHUB_TOKEN not set; skipping login (assuming cached credentials or public images)."
fi

# ---------------------------------------------------------------------------
# Step 3: Pull previous images for all three app services
# ---------------------------------------------------------------------------
for SERVICE in shopee-api shopee-web shopee-admin; do
  echo "==> Pulling $REGISTRY/$SERVICE:$PREV_TAG"
  docker pull "$REGISTRY/$SERVICE:$PREV_TAG"
done

# Export for docker compose image: interpolation (${REGISTRY}/${SERVICE}:${IMAGE_TAG}).
export REGISTRY
export IMAGE_TAG="$PREV_TAG"

# ---------------------------------------------------------------------------
# Step 4: Restart all app containers with previous images
# ---------------------------------------------------------------------------
echo "==> Restarting all app containers with previous images..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps shopee-api shopee-web shopee-admin

# ---------------------------------------------------------------------------
# Step 5: Verify rollback with health check
# ---------------------------------------------------------------------------
echo "==> Verifying rollback health..."
if ! "$SCRIPT_DIR/health-check.sh" shopee-api shopee-web shopee-admin; then
  echo "ERROR: Health check failed after rollback. Manual intervention required." >&2
  exit 1
fi

echo "==> Rollback complete. Services restored to $PREV_TAG."

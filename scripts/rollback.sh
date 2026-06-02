#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# rollback.sh — Restore all app services to the previous deployed SHA.
#
# Reads the previous SHA from /opt/shopee/backups/.previous-sha, pulls the
# corresponding images from GHCR, restarts all three app containers, and
# runs a health check to verify the rollback succeeded.
#
# Usage: rollback.sh
#   No arguments. Reads state from .previous-sha file.
#
# Environment variables:
#   REGISTRY — GHCR base URL (default: ghcr.io/<GITHUB_REPOSITORY_OWNER>)
#              Set GITHUB_REPOSITORY_OWNER or override REGISTRY directly.
# ---------------------------------------------------------------------------

PREVIOUS_SHA_FILE="/opt/shopee/backups/.previous-sha"
COMPOSE_FILE="/opt/shopee/docker-compose.prod.yaml"

# Determine registry base
REGISTRY="${REGISTRY:-ghcr.io/${GITHUB_REPOSITORY_OWNER:-OWNER}}"

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
# Step 2: Pull previous images for all three app services
# ---------------------------------------------------------------------------
for SERVICE in shopee-api shopee-web shopee-admin; do
  echo "==> Pulling $REGISTRY/$SERVICE:$PREV_TAG"
  docker pull "$REGISTRY/$SERVICE:$PREV_TAG"
done

# ---------------------------------------------------------------------------
# Step 3: Restart all app containers with previous images
# ---------------------------------------------------------------------------
echo "==> Restarting all app containers with previous images..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps shopee-api shopee-web shopee-admin

# ---------------------------------------------------------------------------
# Step 4: Verify rollback with health check
# ---------------------------------------------------------------------------
echo "==> Verifying rollback health..."
if ! /opt/shopee/scripts/health-check.sh shopee-api shopee-web shopee-admin; then
  echo "ERROR: Health check failed after rollback. Manual intervention required." >&2
  exit 1
fi

echo "==> Rollback complete. Services restored to $PREV_TAG."

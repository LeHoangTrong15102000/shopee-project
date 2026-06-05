#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# deploy.sh — Pull new Docker images from Docker Hub and perform a rolling update.
#
# Usage: deploy.sh <REGISTRY> <IMAGE_TAG> <SERVICES...>
#   REGISTRY   — Docker Hub username, e.g. myuser
#   IMAGE_TAG  — Immutable SHA tag, e.g. sha-a1b2c3d
#   SERVICES   — Space-separated list of service names to update,
#                e.g. "shopee-api shopee-web shopee-admin"
# ---------------------------------------------------------------------------

REGISTRY="${1:-}"
IMAGE_TAG="${2:-}"
# Remaining args are services
shift 2 2>/dev/null || true
SERVICES="${*:-}"

# Validate required arguments
if [ -z "$REGISTRY" ] || [ -z "$IMAGE_TAG" ] || [ -z "$SERVICES" ]; then
  echo "ERROR: Missing required arguments." >&2
  echo "Usage: $0 <REGISTRY> <IMAGE_TAG> <SERVICES...>" >&2
  echo "  REGISTRY  — Docker Hub username, e.g. myuser" >&2
  echo "  IMAGE_TAG — Image tag, e.g. sha-a1b2c3d" >&2
  echo "  SERVICES  — Space-separated service names, e.g. shopee-api shopee-web" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yaml"
BACKUPS_DIR="$PROJECT_ROOT/backups"
PREVIOUS_SHA_FILE="$BACKUPS_DIR/.previous-sha"

# Export so docker compose can interpolate ${REGISTRY} and ${IMAGE_TAG} in image: fields.
export REGISTRY
export IMAGE_TAG

echo "==> Deploy started: registry=$REGISTRY tag=$IMAGE_TAG services=$SERVICES"

# ---------------------------------------------------------------------------
# Step 1: Capture current running image SHA into a variable — do NOT write to
# disk yet.  We only persist this to .previous-sha AFTER the new deploy passes
# its health check, ensuring .previous-sha always points at a confirmed-healthy
# SHA rather than whatever happened to be running (which may itself be broken).
# ---------------------------------------------------------------------------
mkdir -p "$BACKUPS_DIR"

PRIOR_SHA=""
# Try to read the running image tag from the first app service container.
for svc in shopee-api shopee-web shopee-admin; do
  CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q "$svc" 2>/dev/null | head -1 || true)
  if [ -n "$CONTAINER_ID" ]; then
    RUNNING_IMAGE=$(docker inspect --format '{{.Config.Image}}' "$CONTAINER_ID" 2>/dev/null || true)
    # Extract sha-XXXXXXX from image tag like myuser/shopee-api:sha-a1b2c3d
    EXTRACTED=$(echo "$RUNNING_IMAGE" | grep -oE 'sha-[a-f0-9]{7}' | head -1 || true)
    if [ -n "$EXTRACTED" ]; then
      PRIOR_SHA="$EXTRACTED"
      break
    fi
  fi
done

if [ -n "$PRIOR_SHA" ]; then
  echo "==> Captured prior running SHA: $PRIOR_SHA (will persist only after health check passes)"
else
  echo "==> Could not determine prior running SHA; no rollback target will be recorded."
fi

# ---------------------------------------------------------------------------
# Step 2: Login to Docker Hub
# ---------------------------------------------------------------------------
echo "==> Logging in to Docker Hub..."
echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin

# ---------------------------------------------------------------------------
# Step 3: Pull new images
# ---------------------------------------------------------------------------
for SERVICE in $SERVICES; do
  echo "==> Pulling $REGISTRY/$SERVICE:$IMAGE_TAG"
  docker pull "$REGISTRY/$SERVICE:$IMAGE_TAG"
done

# ---------------------------------------------------------------------------
# Step 4: Rolling update — restart each service individually
# ---------------------------------------------------------------------------
for SERVICE in $SERVICES; do
  echo "==> Updating $SERVICE..."
  docker compose -f "$COMPOSE_FILE" up -d --no-deps --remove-orphans "$SERVICE"
done

# ---------------------------------------------------------------------------
# Step 5: Health check — rollback on failure
# ---------------------------------------------------------------------------
echo "==> Running health checks for: $SERVICES"
if ! "$SCRIPT_DIR/health-check.sh" $SERVICES; then
  echo "ERROR: Health check failed after deploy." >&2

  # Guard: determine the rollback target before attempting rollback.
  ROLLBACK_TARGET=""
  if [ -f "$PREVIOUS_SHA_FILE" ]; then
    ROLLBACK_TARGET=$(cat "$PREVIOUS_SHA_FILE" | tr -d '[:space:]')
  fi

  # Guard A: if the stored previous-sha equals the SHA that just failed, rolling
  # back into it would only reproduce the same crash-loop. Abort cleanly instead.
  if [ -n "$ROLLBACK_TARGET" ] && [ "$ROLLBACK_TARGET" = "$IMAGE_TAG" ]; then
    echo "ERROR: Rollback target ($ROLLBACK_TARGET) is the same as the just-failed tag ($IMAGE_TAG)." >&2
    echo "       Aborting rollback — rolling back to this SHA would reproduce the same failure." >&2
    echo "       Manual intervention required: inspect logs and push a fixed image." >&2
    exit 1
  fi

  # Guard B (poisoned-state guard): if the stored previous-sha points at a SHA
  # whose containers are currently crash-looping (Restarting status), refuse to
  # roll back to it. A crash-looping rollback target is not a safe recovery point.
  if [ -n "$ROLLBACK_TARGET" ]; then
    LOOPING=$(docker ps --filter "status=restarting" --format "{{.Image}}" 2>/dev/null \
              | grep -oE 'sha-[a-f0-9]{7}' | sort -u || true)
    if echo "$LOOPING" | grep -qF "$ROLLBACK_TARGET"; then
      echo "ERROR: Rollback target ($ROLLBACK_TARGET) is currently crash-looping on the VPS." >&2
      echo "       Refusing rollback to a poisoned image — this would reproduce the crash-loop." >&2
      echo "       Manual intervention required:" >&2
      echo "         1. Remove backups/.previous-sha manually." >&2
      echo "         2. Stop crash-looping containers: docker compose down --remove-orphans" >&2
      echo "         3. Push a fixed image to master." >&2
      exit 1
    fi
  fi

  if [ -z "$ROLLBACK_TARGET" ]; then
    echo "ERROR: No previous SHA recorded. Cannot roll back — no known-good target." >&2
    echo "       Manual intervention required: push a fixed image to master." >&2
    exit 1
  fi

  echo "==> Triggering rollback to $ROLLBACK_TARGET..."
  # Export FAILED_TAG so rollback.sh can independently refuse to restore the
  # same broken image even if called in a separate shell context.
  export FAILED_TAG="$IMAGE_TAG"
  "$SCRIPT_DIR/rollback.sh"
  exit 1
fi

# ---------------------------------------------------------------------------
# Health check passed — now it is safe to persist the prior SHA.
# This ensures .previous-sha always points at a SHA that was healthy when recorded.
# ---------------------------------------------------------------------------
if [ -n "$PRIOR_SHA" ]; then
  echo "$PRIOR_SHA" > "$PREVIOUS_SHA_FILE"
  echo "==> Persisted confirmed-healthy prior SHA: $PRIOR_SHA"
else
  echo "==> No prior SHA to record (first deploy or could not detect running image)."
fi

echo "==> Deploy complete."

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
# Step 1: Save current running image SHA before any changes
# ---------------------------------------------------------------------------
mkdir -p "$BACKUPS_DIR"

CURRENT_SHA=""
# Try to read the running image tag from the first app service container
for svc in shopee-api shopee-web shopee-admin; do
  CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q "$svc" 2>/dev/null | head -1 || true)
  if [ -n "$CONTAINER_ID" ]; then
    RUNNING_IMAGE=$(docker inspect --format '{{.Config.Image}}' "$CONTAINER_ID" 2>/dev/null || true)
    # Extract sha-XXXXXXX from image tag like myuser/shopee-api:sha-a1b2c3d
    EXTRACTED=$(echo "$RUNNING_IMAGE" | grep -oE 'sha-[a-f0-9]{7}' | head -1 || true)
    if [ -n "$EXTRACTED" ]; then
      CURRENT_SHA="$EXTRACTED"
      break
    fi
  fi
done

if [ -n "$CURRENT_SHA" ]; then
  echo "$CURRENT_SHA" > "$PREVIOUS_SHA_FILE"
  echo "==> Saved previous SHA: $CURRENT_SHA"
else
  # Fall back to writing the incoming tag as a best-effort record
  echo "$IMAGE_TAG" > "$PREVIOUS_SHA_FILE"
  echo "==> Could not determine running SHA; recorded current tag as fallback: $IMAGE_TAG"
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
  echo "ERROR: Health check failed after deploy. Triggering rollback..." >&2
  "$SCRIPT_DIR/rollback.sh"
  exit 1
fi

echo "==> Deploy complete."

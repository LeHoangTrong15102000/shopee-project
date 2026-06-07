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
#   FAILED_TAG         — (optional) The just-failed SHA tag, set by deploy.sh.
#                        When provided, rollback refuses to restore the same broken image.
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PREVIOUS_SHA_FILE="$PROJECT_ROOT/backups/.previous-sha"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yaml"

# Determine registry base
REGISTRY="${REGISTRY:-${DOCKERHUB_USERNAME:-OWNER}}"

# ---------------------------------------------------------------------------
# retry_with_backoff — Run a command, retrying on failure with exponential
# backoff. Designed for transient Docker Hub registry timeouts
# ("context deadline exceeded"). Returns the command's exit code; on final
# failure it returns non-zero so `set -euo pipefail` still aborts the deploy.
#
# Usage: retry_with_backoff <max_attempts> <initial_delay_seconds> <cmd...>
# ---------------------------------------------------------------------------
retry_with_backoff() {
  local max_attempts="$1"
  local delay="$2"
  shift 2
  local attempt=1
  until "$@"; do
    local exit_code=$?
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "ERROR: command failed after $attempt attempt(s): $*" >&2
      return "$exit_code"
    fi
    echo "==> Attempt $attempt/$max_attempts failed (exit $exit_code). Retrying in ${delay}s: $*" >&2
    sleep "$delay"
    attempt=$((attempt + 1))
    delay=$((delay * 2))
  done
  return 0
}

# ---------------------------------------------------------------------------
# Step 1: Read previous SHA — abort with a clear error if missing or empty
# ---------------------------------------------------------------------------
if [ ! -f "$PREVIOUS_SHA_FILE" ]; then
  echo "ERROR: No previous SHA file found at $PREVIOUS_SHA_FILE." >&2
  echo "       Cannot roll back — no previous deployment recorded." >&2
  echo "       Manual intervention required: push a fixed image to master." >&2
  exit 1
fi

PREV_SHA=$(cat "$PREVIOUS_SHA_FILE" | tr -d '[:space:]')

if [ -z "$PREV_SHA" ]; then
  echo "ERROR: Previous SHA file exists but is empty: $PREVIOUS_SHA_FILE" >&2
  echo "       Cannot roll back — no previous deployment recorded." >&2
  echo "       Manual intervention required: push a fixed image to master." >&2
  exit 1
fi

# Normalise: if the stored value already starts with "sha-", use as-is;
# otherwise construct the tag from the raw SHA.
if echo "$PREV_SHA" | grep -qE '^sha-[a-f0-9]{7}$'; then
  PREV_TAG="$PREV_SHA"
else
  PREV_TAG="sha-$(echo "$PREV_SHA" | cut -c1-7)"
fi

# ---------------------------------------------------------------------------
# Guard: refuse to roll back to the SHA that just failed (equality check).
# deploy.sh sets FAILED_TAG before invoking rollback.sh; standalone callers
# may also set it explicitly.  This prevents the death-loop where rollback
# recreates all services into the same broken image and re-runs health checks.
# ---------------------------------------------------------------------------
FAILED_TAG="${FAILED_TAG:-}"
if [ -n "$FAILED_TAG" ] && [ "$PREV_TAG" = "$FAILED_TAG" ]; then
  echo "ERROR: Rollback target ($PREV_TAG) equals the just-failed tag ($FAILED_TAG)." >&2
  echo "       Aborting rollback — restoring this image would reproduce the same failure." >&2
  echo "       Manual intervention required: push a fixed image to master." >&2
  exit 1
fi

echo "==> Rolling back to tag: $PREV_TAG (registry: $REGISTRY)"

# ---------------------------------------------------------------------------
# Step 2: Login to Docker Hub (for standalone runs)
# ---------------------------------------------------------------------------
if [ -n "${DOCKERHUB_USERNAME:-}" ] && [ -n "${DOCKERHUB_TOKEN:-}" ]; then
  echo "==> Logging in to Docker Hub..."
  _docker_login() {
    echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
  }
  retry_with_backoff 5 5 _docker_login
else
  echo "==> DOCKERHUB_USERNAME/DOCKERHUB_TOKEN not set; skipping login (assuming cached credentials or public images)."
fi

# ---------------------------------------------------------------------------
# Step 3: Pull previous images for all three app services
# ---------------------------------------------------------------------------
for SERVICE in shopee-api shopee-web shopee-admin; do
  echo "==> Pulling $REGISTRY/$SERVICE:$PREV_TAG"
  retry_with_backoff 5 5 docker pull "$REGISTRY/$SERVICE:$PREV_TAG"
done

# Export for docker compose image: interpolation (${REGISTRY}/${SERVICE}:${IMAGE_TAG}).
export REGISTRY
export IMAGE_TAG="$PREV_TAG"

# ---------------------------------------------------------------------------
# Step 4: Restart app containers — skip services already on the rollback target
# to avoid needless recreation and downtime.
# ---------------------------------------------------------------------------
echo "==> Restarting app containers with previous images (skipping already-current services)..."
SERVICES_TO_RESTART=""
for SERVICE in shopee-api shopee-web shopee-admin; do
  CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q "$SERVICE" 2>/dev/null | head -1 || true)
  CURRENT_TAG=""
  if [ -n "$CONTAINER_ID" ]; then
    RUNNING_IMAGE=$(docker inspect --format '{{.Config.Image}}' "$CONTAINER_ID" 2>/dev/null || true)
    CURRENT_TAG=$(echo "$RUNNING_IMAGE" | grep -oE 'sha-[a-f0-9]{7}' | head -1 || true)
  fi
  if [ "$CURRENT_TAG" = "$PREV_TAG" ]; then
    echo "==> $SERVICE is already on $PREV_TAG — skipping recreation."
  else
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART $SERVICE"
  fi
done

if [ -n "$SERVICES_TO_RESTART" ]; then
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" up -d --no-deps $SERVICES_TO_RESTART
else
  echo "==> All services are already on $PREV_TAG — no containers recreated."
fi

# ---------------------------------------------------------------------------
# Step 5: Verify rollback with health check
# ---------------------------------------------------------------------------
echo "==> Verifying rollback health..."
if ! "$SCRIPT_DIR/health-check.sh" shopee-api shopee-web shopee-admin; then
  echo "ERROR: Health check failed after rollback. Manual intervention required." >&2
  exit 1
fi

echo "==> Rollback complete. Services restored to $PREV_TAG."

#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# health-check.sh — Verify that deployed services are responding.
#
# Usage: health-check.sh [SERVICE...]
#   SERVICE — Optional list of services to check.
#             Defaults to: shopee-api shopee-web shopee-admin
#
# Retries each service up to 30 times with 5s sleep (150s total timeout).
# Exits 0 if all services are healthy; exits 1 listing failed services.
# ---------------------------------------------------------------------------

SERVICES="${*:-shopee-api shopee-web shopee-admin}"

MAX_ATTEMPTS=30
SLEEP_SECONDS=5

# Map service name → health endpoint URL
service_url() {
  case "$1" in
    shopee-api)   echo "http://127.0.0.1:8083/health" ;;
    shopee-web)   echo "http://127.0.0.1:8081/" ;;
    shopee-admin) echo "http://127.0.0.1:8082/" ;;
    *)
      echo "ERROR: Unknown service '$1'. Cannot determine health URL." >&2
      exit 1
      ;;
  esac
}

FAILED_SERVICES=()

for SERVICE in $SERVICES; do
  URL=$(service_url "$SERVICE")
  echo "==> Checking $SERVICE at $URL (max ${MAX_ATTEMPTS} attempts, ${SLEEP_SECONDS}s interval)..."

  HEALTHY=false
  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
      echo "    [$SERVICE] Healthy on attempt $attempt (HTTP $HTTP_STATUS)"
      HEALTHY=true
      break
    else
      echo "    [$SERVICE] Attempt $attempt/$MAX_ATTEMPTS — HTTP $HTTP_STATUS, retrying in ${SLEEP_SECONDS}s..."
      sleep "$SLEEP_SECONDS"
    fi
  done

  if [ "$HEALTHY" = "false" ]; then
    echo "ERROR: [$SERVICE] did not become healthy after $MAX_ATTEMPTS attempts." >&2
    FAILED_SERVICES+=("$SERVICE")
  fi
done

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
  echo "ERROR: The following services failed health checks: ${FAILED_SERVICES[*]}" >&2
  exit 1
fi

echo "==> All services healthy."
exit 0

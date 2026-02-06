#!/bin/bash
set -euo pipefail

# Coolify Deployment Script
# Triggers a deployment via the Coolify REST API.
#
# Required environment variables:
#   COOLIFY_URL   - Your Coolify instance URL (e.g., https://coolify.example.com)
#   COOLIFY_TOKEN - API bearer token from Coolify settings
#   APP_UUID      - The application UUID in Coolify

COOLIFY_URL="${COOLIFY_URL:-http://89.47.113.196:8000}"
COOLIFY_TOKEN="${COOLIFY_TOKEN:-1|gLNvAM35l8nWZdtEuG1unpwtNuaP77VPi4WA4bwO1b21562a}"
APP_UUID="${APP_UUID:-u4ksccssw8ow4cogckkwgk8c}"

echo "========================================"
echo "  Coolify Deployment"
echo "========================================"
echo "Instance: ${COOLIFY_URL}"
echo "App UUID: ${APP_UUID}"
echo ""

echo "Triggering deployment..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${COOLIFY_URL}/api/v1/deploy" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"uuid\": \"${APP_UUID}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "Deployment triggered successfully!"
  echo "Response: ${BODY}"
  echo ""
  echo "Check deployment status at: ${COOLIFY_URL}"
else
  echo "ERROR: Deployment failed with HTTP ${HTTP_CODE}"
  echo "Response: ${BODY}"
  exit 1
fi

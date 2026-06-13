#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUMMARY="$ROOT_DIR/deployments/testnet/latest.json"

if [ ! -f "$SUMMARY" ]; then
  echo "Missing deployment summary:"
  echo "$SUMMARY"
  echo ""
  echo "Create deployments/testnet/latest.json from the latest publish output first."
  exit 1
fi

PACKAGE_ID="$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if(!j.packageId){process.exit(1)} console.log(j.packageId)" "$SUMMARY")"
ADMIN_CAP_ID="$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(j.adminCapId || '')" "$SUMMARY")"
PUBLISH_DIGEST="$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(j.publishDigest || '')" "$SUMMARY")"

cat > "$ROOT_DIR/backend/.env" <<ENVEOF
NAMI_NETWORK=testnet
NAMI_PACKAGE_ID=$PACKAGE_ID
NAMI_ADMIN_CAP_ID=$ADMIN_CAP_ID
NAMI_PUBLISH_DIGEST=$PUBLISH_DIGEST

NAMI_POLL_INTERVAL_MS=5000
NAMI_PAGE_LIMIT=50
NAMI_MAX_PAGES_PER_MODULE=5

NAMI_CURSOR_PATH=data/cursors.json
NAMI_EVENT_LOG_PATH=data/events.jsonl
ENVEOF

cat > "$ROOT_DIR/frontend/.env" <<ENVEOF
VITE_NAMI_NETWORK=testnet
VITE_NAMI_PACKAGE_ID=$PACKAGE_ID
VITE_NAMI_ADMIN_CAP_ID=$ADMIN_CAP_ID
VITE_NAMI_PUBLISH_DIGEST=$PUBLISH_DIGEST
ENVEOF

echo "Synced testnet environment files:"
echo "backend/.env"
echo "frontend/.env"
echo ""
echo "Package ID: $PACKAGE_ID"
echo "AdminCap ID: $ADMIN_CAP_ID"
echo "Publish Digest: $PUBLISH_DIGEST"

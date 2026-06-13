#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUMMARY="$ROOT_DIR/deployments/testnet/latest.json"

echo ""
echo "===================================="
echo "Nami MVP Demo Info"
echo "===================================="
echo ""

if [ ! -f "$SUMMARY" ]; then
  echo "Missing deployments/testnet/latest.json"
  echo "Run a successful testnet publish first."
  exit 1
fi

PACKAGE_ID="$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(j.packageId || '')" "$SUMMARY")"
ADMIN_CAP_ID="$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(j.adminCapId || '')" "$SUMMARY")"
PUBLISH_DIGEST="$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(j.publishDigest || '')" "$SUMMARY")"

echo "Network: testnet"
echo "Package ID: $PACKAGE_ID"
echo "AdminCap ID: $ADMIN_CAP_ID"
echo "Publish Digest: $PUBLISH_DIGEST"

echo ""
echo "Core commands:"
echo ""
echo "  bash scripts/sync-testnet-env.sh"
echo "  bash scripts/mvp-check.sh"
echo "  npm --prefix frontend run dev"
echo ""

echo "Frontend:"
echo "  http://localhost:5173"
echo ""

echo "Docs:"
echo "  docs/mvp-demo-flow.md"
echo "  docs/mvp-smoke-checklist.md"
echo "  docs/roadmap.md"
echo ""

echo "===================================="
echo "Ready for MVP demo"
echo "===================================="

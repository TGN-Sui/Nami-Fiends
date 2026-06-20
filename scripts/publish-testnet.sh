#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/contracts/nami"
OUT_DIR="$ROOT_DIR/deployments/testnet"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"

mkdir -p "$OUT_DIR"

echo "Publishing Nami Move package to testnet..."
echo "Package dir: $PACKAGE_DIR"

cd "$PACKAGE_DIR"

sui client switch --env testnet

sui move build --build-env testnet

sui client publish \
  --gas-budget 500000000 \
  --json \
  > "$OUT_DIR/publish-$TIMESTAMP.json"

PUBLISH_JSON="$OUT_DIR/publish-$TIMESTAMP.json"

echo "Publish output saved:"
echo "$PUBLISH_JSON"
echo ""
echo "Extracting deployment summary..."
node "$ROOT_DIR/scripts/extract-testnet-latest.mjs" "$PUBLISH_JSON"
echo ""
echo "Syncing env files (edit placeholders after)..."
node "$ROOT_DIR/scripts/sync-testnet-env.mjs"
echo ""
echo "Next:"
echo "1. Set official owner, treasury, and zkLogin client ID in backend/.env and frontend/.env.local"
echo "2. node scripts/verify-testnet-ready.mjs"
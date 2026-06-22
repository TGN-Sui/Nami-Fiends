#!/usr/bin/env bash
set -euo pipefail

NETWORK="${1:-}"

if [[ "$NETWORK" != "devnet" && "$NETWORK" != "testnet" ]]; then
  echo "Usage: ./scripts/publish-package.sh <devnet|testnet>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/contracts/nami"
OUT_DIR="$ROOT_DIR/deployments/$NETWORK"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"

mkdir -p "$OUT_DIR"

echo "Publishing Nami Move package to $NETWORK..."
echo "Package dir: $PACKAGE_DIR"

cd "$PACKAGE_DIR"

sui client switch --env "$NETWORK"
sui move build --build-env testnet

PUBLISH_JSON="$OUT_DIR/publish-$TIMESTAMP.json"

sui client publish \
  --gas-budget 500000000 \
  --json \
  > "$PUBLISH_JSON"

echo "Publish output saved:"
echo "$PUBLISH_JSON"
echo ""
echo "Extracting deployment summary..."
node "$ROOT_DIR/scripts/extract-deployment.mjs" "$NETWORK" "$PUBLISH_JSON"

if [[ "$NETWORK" == "testnet" ]]; then
  echo ""
  echo "Syncing env files (edit placeholders after)..."
  node "$ROOT_DIR/scripts/sync-testnet-env.mjs"
  echo ""
  echo "Next:"
  echo "1. Set official owner, treasury, and zkLogin client ID in backend/.env and frontend/.env.local"
  echo "2. node scripts/verify-testnet-ready.mjs"
fi
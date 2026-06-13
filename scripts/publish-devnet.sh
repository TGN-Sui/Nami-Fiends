#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/contracts/nami"
OUT_DIR="$ROOT_DIR/deployments/devnet"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"

mkdir -p "$OUT_DIR"

echo "Publishing Nami Move package to devnet..."
echo "Package dir: $PACKAGE_DIR"

cd "$PACKAGE_DIR"

sui client switch --env devnet

sui move build --build-env testnet

sui client publish \
  --build-env testnet \
  --gas-budget 100000000 \
  --json \
  > "$OUT_DIR/publish-$TIMESTAMP.json"

echo "Publish output saved:"
echo "$OUT_DIR/publish-$TIMESTAMP.json"
echo ""
echo "Next:"
echo "1. Extract packageId and AdminCap ID from the JSON."
echo "2. Save deployment summary to deployments/devnet/latest.json."
echo "3. Update backend/.env and frontend/.env."
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/contracts/nami"

echo "Phase 1 protocol check — build + Move tests"
echo "Package dir: $PACKAGE_DIR"

cd "$PACKAGE_DIR"

sui move build --build-env testnet
sui move test

echo ""
echo "Phase 1 protocol check passed."
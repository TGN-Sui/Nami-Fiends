#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SDK_DIR="$ROOT_DIR/SDK"

echo ""
echo "===================================="
echo "Nami Phase 4 SDK Check"
echo "===================================="
echo ""

echo "[1/5] SDK install"
npm --prefix "$SDK_DIR" install

echo ""
echo "[2/5] SDK typecheck"
npm --prefix "$SDK_DIR" run typecheck

echo ""
echo "[3/5] SDK build"
npm --prefix "$SDK_DIR" run build

echo ""
echo "[4/5] SDK unit tests"
npm --prefix "$SDK_DIR" run test -- src/indexer-subscriptions.test.ts

echo ""
echo "[5/5] SDK indexer probe"
if [ -n "${NAMI_INDEXER_URL:-}" ]; then
  node "$ROOT_DIR/scripts/verify-sdk-indexer.mjs" --url "$NAMI_INDEXER_URL"
  NAMI_INDEXER_URL="$NAMI_INDEXER_URL" npm --prefix "$SDK_DIR" run test:integration
else
  echo "NAMI_INDEXER_URL unset — skipping live SDK integration probes."
  echo "Start backend then run:"
  echo "  NAMI_INDEXER_URL=http://localhost:8787 $0"
fi

echo ""
echo "===================================="
echo "Phase 4 SDK Check Complete"
echo "===================================="
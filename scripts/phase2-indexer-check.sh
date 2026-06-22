#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "===================================="
echo "Nami Phase 2 Indexer Check"
echo "===================================="
echo ""

echo "[1/5] Backend install"
npm --prefix "$ROOT_DIR/backend" install

echo ""
echo "[2/5] Backend typecheck"
npm --prefix "$ROOT_DIR/backend" run typecheck

echo ""
echo "[3/5] Pinned testnet deployment summary"
if [ -f "$ROOT_DIR/deployments/testnet/latest.json" ]; then
  cat "$ROOT_DIR/deployments/testnet/latest.json"
else
  echo "Missing deployments/testnet/latest.json"
  exit 1
fi

echo ""
echo "[4/5] Backend README + ops scripts present"
for required in \
  "$ROOT_DIR/backend/README.md" \
  "$ROOT_DIR/backend/src/indexer-runtime.ts" \
  "$ROOT_DIR/scripts/verify-indexer.mjs"
do
  if [ ! -f "$required" ]; then
    echo "Missing required file: $required"
    exit 1
  fi
done
echo "Required Phase 2 files present."

echo ""
echo "[5/5] Indexer probe"
if [ -n "${NAMI_INDEXER_URL:-}" ]; then
  node "$ROOT_DIR/scripts/verify-indexer.mjs" --url "$NAMI_INDEXER_URL"
else
  echo "NAMI_INDEXER_URL unset — skipping live /health /ready /stats probes."
  echo "Start backend (npm --prefix backend run dev) then run:"
  echo "  NAMI_INDEXER_URL=http://localhost:8787 $0"
fi

echo ""
echo "===================================="
echo "Phase 2 Indexer Check Complete"
echo "===================================="
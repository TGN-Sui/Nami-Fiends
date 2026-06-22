#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "===================================="
echo "Nami Phase 3 Live-Surface Audit"
echo "===================================="
echo ""

echo "[1/3] Frontend typecheck"
npm --prefix "$ROOT_DIR/frontend" install
npm --prefix "$ROOT_DIR/frontend" run typecheck

echo ""
echo "[2/3] Live-surface policy audit"
node "$ROOT_DIR/scripts/phase3-live-audit.mjs"

echo ""
echo "[3/3] Frontend test suite (full)"
npm --prefix "$ROOT_DIR/frontend" test

echo ""
echo "===================================="
echo "Phase 3 Live-Surface Audit Complete"
echo "===================================="
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "===================================="
echo "Nami Phase 5 zkLogin Check"
echo "===================================="
echo ""

echo "[1/4] Frontend typecheck"
npm --prefix "$ROOT_DIR/frontend" install
npm --prefix "$ROOT_DIR/frontend" run typecheck

echo ""
echo "[2/4] zkLogin policy unit tests"
npm --prefix "$ROOT_DIR/frontend" test -- \
  src/zklogin-config.test.ts \
  src/wallet-source.test.ts \
  src/app-config.test.ts \
  src/live-surface-audit.test.ts

echo ""
echo "[3/4] zkLogin env verification"
node "$ROOT_DIR/scripts/verify-zklogin-config.mjs"

echo ""
echo "[4/4] Testnet readiness (includes zkLogin)"
node "$ROOT_DIR/scripts/verify-testnet-ready.mjs" || {
  echo "verify-testnet-ready reported issues — expected until public URL + secrets are set."
}

echo ""
echo "===================================="
echo "Phase 5 zkLogin Check Complete"
echo "===================================="
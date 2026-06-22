#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "===================================="
echo "Nami Phase 8 Deploy Check"
echo "===================================="
echo ""

echo "[1/5] Move package pinned (no republish)"
if [[ ! -f "$ROOT_DIR/deployments/testnet/latest.json" ]]; then
  echo "Missing deployments/testnet/latest.json"
  exit 1
fi
node -e "const s=require('$ROOT_DIR/deployments/testnet/latest.json'); console.log('packageId:', s.packageId)"

echo ""
echo "[2/5] Local testnet env + zkLogin policy"
node "$ROOT_DIR/scripts/verify-testnet-ready.mjs" || {
  echo "verify-testnet-ready reported issues — fix env before public deploy."
  exit 1
}
node "$ROOT_DIR/scripts/verify-zklogin-config.mjs"

echo ""
echo "[3/5] Public URL probes (Render + Vercel origins)"
node "$ROOT_DIR/scripts/verify-public-deploy.mjs" || {
  echo "verify-public-deploy reported issues — expected until public URLs are set."
}

echo ""
echo "[4/5] Frontend production build"
npm --prefix "$ROOT_DIR/frontend" install
npm --prefix "$ROOT_DIR/frontend" run typecheck
npm --prefix "$ROOT_DIR/frontend" run build

echo ""
echo "[5/5] Backend typecheck"
npm --prefix "$ROOT_DIR/backend" install
npm --prefix "$ROOT_DIR/backend" run typecheck

echo ""
echo "===================================="
echo "Phase 8 Deploy Check Complete"
echo "===================================="
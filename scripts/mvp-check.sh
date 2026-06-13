#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "===================================="
echo "Nami MVP Check"
echo "===================================="
echo ""

echo "[1/7] Move build"
cd "$ROOT_DIR/contracts/nami"
sui move build --build-env testnet

echo ""
echo "[2/7] Move tests"
sui move test

echo ""
echo "[3/7] Backend typecheck"
cd "$ROOT_DIR"
npm --prefix backend install
npm --prefix backend run typecheck

echo ""
echo "[4/7] SDK typecheck"
npm --prefix sdk install
npm --prefix sdk run typecheck

echo ""
echo "[5/7] SDK build"
npm --prefix sdk run build

echo ""
echo "[6/7] Frontend typecheck"
npm --prefix frontend install
npm --prefix frontend run typecheck

echo ""
echo "[7/7] Frontend build"
npm --prefix frontend run build

echo ""
echo "Deployment summary:"
if [ -f "$ROOT_DIR/deployments/testnet/latest.json" ]; then
  cat "$ROOT_DIR/deployments/testnet/latest.json"
else
  echo "No deployments/testnet/latest.json found."
fi

echo ""
echo "===================================="
echo "Nami MVP Check Complete"
echo "===================================="
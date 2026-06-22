# Nami Deployments

## Purpose

This folder stores deployment outputs and summaries for Nami Move package publishes.

Raw publish JSON files are saved per network.

Deployment summaries should be saved as `latest.json` for backend/frontend configuration.

## Testnet workflow

```bash
# Republish (when Move sources change)
./scripts/publish-package.sh testnet
# or: ./scripts/publish-testnet.sh

# Devnet publish + latest.json extract
./scripts/publish-package.sh devnet

# Local protocol gate (build + 82 Move tests)
./scripts/phase1-protocol-check.sh

# Or refresh env from existing latest.json
node scripts/sync-testnet-env.mjs --indexer-url https://api.example --zklogin-origin https://app.example/

# Verify
node scripts/verify-testnet-ready.mjs
```

Current testnet `latest.json` package: see file under `deployments/testnet/`.

## Networks

```text
deployments/devnet/
deployments/testnet/
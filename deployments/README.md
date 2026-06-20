# Nami Deployments

## Purpose

This folder stores deployment outputs and summaries for Nami Move package publishes.

Raw publish JSON files are saved per network.

Deployment summaries should be saved as `latest.json` for backend/frontend configuration.

## Testnet workflow

```bash
# Republish (when Move sources change)
./scripts/publish-testnet.sh

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
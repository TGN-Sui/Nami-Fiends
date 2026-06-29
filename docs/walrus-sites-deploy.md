# Walrus Sites — Nami Frontend Deploy (Phase 9.1)

Deploy the static Nami React SPA to **Walrus Sites** so the protocol surface is hosted on the Sui stack. The receiving server (Render) stays separate for payments, projections, and wallet-auth APIs.

Related: [roadmap.md](./roadmap.md) Phase 9.1 · [vision.md](./vision.md) host surfaces · [sui-layer.md](./sui-layer.md)

---

## Architecture

```text
Walrus Sites  →  frontend/dist (HTML, JS, CSS, ws-resources.json)
Render        →  /api/* receiving server (unchanged)
Sui RPC       →  zkLogin, wallet, Move reads from the browser
```

Walrus Sites does **not** host webhooks, writable uploads, or officials queue persistence.

---

## Prerequisites

1. [Sui CLI](https://docs.sui.io/guides/developer/getting-started) wallet with testnet SUI
2. [Walrus CLI](https://docs.wal.app/docs/getting-started) + testnet WAL
3. [site-builder](https://docs.wal.app/docs/sites/getting-started/installing-the-site-builder) installed
4. `sites-config.yaml` — copy [config/walrus-sites-config.example.yaml](../config/walrus-sites-config.example.yaml) to `~/.config/walrus/sites-config.yaml`
5. Frontend env built into the bundle — run `node scripts/sync-testnet-env.mjs` first so `frontend/.env.local` has package IDs and `VITE_NAMI_INDEXER_URL`

---

## Build dist only

```bash
node scripts/prepare-walrus-sites-dist.mjs
```

This builds `SDK` + `frontend` and copies `frontend/ws-resources.json` into `frontend/dist/`.

---

## Dry run

```bash
node scripts/deploy-walrus-sites.mjs --dry-run
```

Prints the `site-builder deploy` command without uploading.

---

## Helper scripts (Windows + cross-platform)

| Script | Purpose |
|--------|---------|
| `scripts/verify-walrus-sites-ready.mjs` | Prerequisite check (config, CLIs, projection, optional `--build`) |
| `scripts/setup-walrus-sites-config.mjs` | Copy example `sites-config.yaml` to user config path |
| `scripts/install-walrus-clis.ps1` | Install Walrus + site-builder on Windows |
| `scripts/start-walrus-portal.ps1` | Run local testnet Walrus Sites portal |
| `scripts/apply-walrus-sites-cutover.mjs` | Sync deploy metadata into env / projection after deploy |
| `scripts/walrus-sites-config-path.mjs` | Shared config + projection path helpers (imported by deploy scripts) |

Quick readiness check:

```bash
node scripts/verify-walrus-sites-ready.mjs
node scripts/verify-walrus-sites-ready.mjs --build
```

Last testnet deploy metadata (when present): `deployments/testnet/walrus-sites-deploy.json`.

---

## Deploy (testnet)

```bash
node scripts/deploy-walrus-sites.mjs --epochs 5 --context testnet
```

| Flag | Default | Purpose |
|------|---------|---------|
| `--epochs` | `5` | Walrus storage duration (testnet epoch ≈ 1 day) |
| `--context` | `testnet` | `sites-config.yaml` context |
| `--config` | — | Path to `sites-config.yaml` if not in default location |
| `--dry-run` | — | Build only, skip site-builder |

On success:

- `site-builder` writes `object_id` to `frontend/dist/ws-resources.json`
- Script syncs `object_id` back to `frontend/ws-resources.json`
- Script writes `backend/data/projections/walrus-site.json` for Launch Ops

Set on Render after first deploy:

```bash
NAMI_WALRUS_SITE_OBJECT_ID=0x...
NAMI_WALRUS_SITE_NETWORK=testnet
NAMI_WALRUS_SITE_EPOCHS=5
```

---

## Browsing the site

| Network | Portal |
|---------|--------|
| **Mainnet** | [wal.app](https://wal.app) after linking SuiNS to the site object |
| **Testnet** | Self-hosted portal required — [deploy locally](https://docs.wal.app/docs/sites/portals/deploy-locally) |

`site-builder` prints a Base36 subdomain URL after deploy. Run `site-builder convert <OBJECT_ID>` to regenerate it.

---

## SPA routing

`frontend/ws-resources.json` maps unknown paths to `/index.html` for future deep links. Nami today uses in-app page state (no URL router); the catch-all route is forward-compatible.

Asset cache headers are set for `/assets/*`; `index.html` is always revalidated.

---

## zkLogin redirect URIs

When moving from Vercel to Walrus Sites, add the **portal origin** to Google OAuth authorized redirect URIs. Update `VITE_ZKLOGIN_REDIRECT_URL` in the build env to match the Walrus Sites portal URL exactly.

See [testnet-zklogin.md](./testnet-zklogin.md).

---

## Epoch renewal

Walrus Sites re-upload the **entire quilt** on each `deploy` — even unchanged files. Re-run deploy before epochs expire:

```bash
node scripts/deploy-walrus-sites.mjs --epochs 5 --context testnet
```

Launch Ops → **Walrus Sites (SPA)** shows last deploy time and site object id.

---

## Mainnet checklist

1. Build with production `VITE_*` env (mainnet package id, Render URL, zkLogin)
2. `node scripts/deploy-walrus-sites.mjs --context mainnet --epochs 53` (or `max`)
3. Link SuiNS name to site object
4. Verify on wal.app
5. Keep Vercel redirect or sunset after DNS cutover

---

## Out of scope

- Hosting the receiving server on Walrus Sites
- Border art bytes (see [border-art-ba14-walrus-quilt.md](./border-art-ba14-walrus-quilt.md) — separate Walrus quilt lane)
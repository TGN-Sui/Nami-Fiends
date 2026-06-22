# zkLogin Setup for Nami Testnet

Nami test launch uses Google zkLogin as the default identity path. You must register the **exact** frontend origin as an OAuth redirect URI.

No testnet package republish is required for zkLogin — only frontend env + Google OAuth registration per deploy origin.

---

## 1. Google Cloud OAuth client

Use the **official owner Google account** (`VITE_NAMI_OFFICIAL_OWNER_EMAIL`, e.g. `robbier640@gmail.com`) when creating the OAuth client and when signing in through zkLogin.

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create **OAuth client ID** → Application type: **Web application**.
3. Add **Authorized JavaScript origins** (no trailing path):
   - Local dev: `http://localhost:5173`
   - Testnet deploy: `https://your-testnet-origin`
4. Add **Authorized redirect URIs** (must match `VITE_ZKLOGIN_REDIRECT_URL` exactly, **with trailing slash**):
   - Local: `http://localhost:5173/`
   - Testnet: `https://your-testnet-origin/`

Copy the client ID into frontend env:

```text
VITE_ZKLOGIN_CLIENT_ID=885352607900-cnbkebbo23ejlbabgvooshre535204qs.apps.googleusercontent.com
VITE_ZKLOGIN_REDIRECT_URL=http://localhost:5173/
```

### Multi-origin policy

Register **one OAuth client per public origin** (or add every origin to the same client’s redirect list before building):

| Deploy | JavaScript origin | Redirect URI |
|--------|-------------------|--------------|
| Local dev | `http://localhost:5173` | `http://localhost:5173/` |
| Staging | `https://staging.example` | `https://staging.example/` |
| Testnet | `https://app.example` | `https://app.example/` |

Rebuild the frontend with the matching `VITE_ZKLOGIN_REDIRECT_URL` for each deploy. Do not ship a build compiled for `localhost` to a public URL.

---

## 2. Mysten salt service (testnet / devnet)

Default (no self-hosting required):

```text
VITE_ZKLOGIN_SALT_URL=https://salt.api.mystenlabs.com/get_salt
```

The salt service derives a stable Sui address from the Google JWT. Nami stores only the derived address and ephemeral key material locally — not the JWT.

### Salt troubleshooting

| Symptom | Fix |
|---------|-----|
| `zkLogin salt request failed (4xx)` | JWT expired — restart sign-in; complete redirect promptly |
| `salt response missing salt` | Wrong salt URL or Mysten outage — verify `VITE_ZKLOGIN_SALT_URL` |
| Different address after re-login | Same Google account + salt should be stable; clear `localStorage` keys `nami.zklogin.*` only for debugging |

---

## 3. Sync env files

After `deployments/testnet/latest.json` is current:

```bash
node scripts/sync-testnet-env.mjs \
  --indexer-url https://api.your-testnet.example \
  --official-owner 0xYOUR_OFFICIAL_OWNER \
  --official-owner-email owner@gmail.com \
  --zklogin-origin https://your-testnet-origin/
```

`--zklogin-origin` is normalized to end with `/` and written to `VITE_ZKLOGIN_REDIRECT_URL`.

Policy enforced on test launch:

```text
VITE_NAMI_TEST_LAUNCH=true
VITE_NAMI_DEV_FIXTURES=false
# Do not set VITE_NAMI_DEMO_OWNER
```

---

## 4. Verify

```bash
node scripts/verify-zklogin-config.mjs
node scripts/verify-testnet-ready.mjs
./scripts/phase5-zklogin-check.sh
```

Build and smoke zkLogin:

```bash
npm --prefix frontend run build
npm --prefix frontend run dev
```

Sign in via **Enter Nami → Sign in with Google**. The redirect must return to your registered origin without OAuth errors.

---

## 5. Test-launch onboarding policy

When `VITE_NAMI_TEST_LAUNCH=true`:

- zkLogin is the primary sign-in path (Settings → Account Sign-In).
- Demo wallet claim and demo owner fallback are disabled.
- Sui wallet connect remains available for purchases, tips, and future on-chain writes.
- Verified signup email is the recovery anchor if Google access is lost.

Recovery flow: after passport is on-chain, open **Settings → Protocol → Recovery** (indexed queue) or follow officials process in `docs/testnet-launch-checklist.md`.

---

## 6. Session lifecycle

- Ephemeral keys + `maxEpoch` are stored in `localStorage` (`nami.zklogin.session`).
- On app load, expired sessions are cleared automatically (`clearZkLoginSessionIfExpired`).
- Sign out clears zkLogin + wallet state from Settings.

---

## Related

- [testnet-launch-checklist.md](./testnet-launch-checklist.md)
- [onboarding.md](./onboarding.md)
- `frontend/src/zklogin-config.ts` — env validation helpers
- `scripts/verify-zklogin-config.mjs` — launch gate
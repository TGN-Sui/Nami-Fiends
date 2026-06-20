# zkLogin Setup for Nami Testnet

Nami test launch uses Google zkLogin as the default identity path. You must register the **exact** frontend origin as an OAuth redirect URI.

---

## 1. Google Cloud OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create **OAuth client ID** → Application type: **Web application**.
3. Add **Authorized JavaScript origins**:
   - Local dev: `http://localhost:5173`
   - Testnet deploy: `https://your-testnet-origin` (no trailing path)
4. Add **Authorized redirect URIs** (must match `VITE_ZKLOGIN_REDIRECT_URL` exactly):
   - Local: `http://localhost:5173/`
   - Testnet: `https://your-testnet-origin/`

Copy the client ID into:

```text
VITE_ZKLOGIN_CLIENT_ID=....apps.googleusercontent.com
VITE_ZKLOGIN_REDIRECT_URL=https://your-testnet-origin/
```

---

## 2. Mysten salt service (testnet / devnet)

Default (no self-hosting required):

```text
VITE_ZKLOGIN_SALT_URL=https://salt.api.mystenlabs.com/get_salt
```

---

## 3. Sync env files

After `deployments/testnet/latest.json` is current:

```bash
node scripts/sync-testnet-env.mjs \
  --indexer-url https://api.your-testnet.example \
  --official-owner 0xYOUR_OFFICIAL_OWNER \
  --zklogin-origin https://your-testnet-origin/
```

This writes `frontend/.env.local` and `backend/.env` with test-launch flags.

---

## 4. Verify

```bash
node scripts/verify-testnet-ready.mjs
```

Build and smoke zkLogin:

```bash
npm --prefix frontend run build
npm --prefix frontend run dev
```

Sign in via **Passport Claim → zkLogin → Sign in with Google**. The redirect must return to your registered origin without OAuth errors.

---

## Related

- [testnet-launch-checklist.md](./testnet-launch-checklist.md)
- [onboarding.md](./onboarding.md)
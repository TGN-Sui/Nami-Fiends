# AdminCap Custody Runbook

Operational guide for holding and recovering the Nami `AdminCap` on testnet and mainnet.

---

## Objects

| Object | ID source | Holder |
|--------|-----------|--------|
| `AdminCap` | `deployments/testnet/latest.json` → `adminCapId` | `NAMI_OFFICIAL_OWNER` wallet |
| Published package | `latest.json` → `packageId` | Immutable on-chain |

Current testnet artifact (pinned until Phase 8 go-live republish):

```text
packageId:          0x74f2e6f200d7a814390b89e2e8a1c7d09fb49968a4362c8ab56e100e9573665f
adminCapId:         0xf4ff9561a7b9dc736b6c9e47b1806fd2e9eeb5eb699e475f86bb82e0cb6258bd
nodenameRegistryId: 0x68e1b656a5fbb5534577f64321fb466512e8534da8749821b085ac8687891fa7
```

---

## Primary holder

1. **Wallet role:** `NAMI_OFFICIAL_OWNER` is the sole on-chain admin for MVP entry points gated by `&AdminCap`.
2. **Access path:** Official owner signs in via Google zkLogin; derived address must match `VITE_NAMI_OFFICIAL_OWNER` / `NAMI_OFFICIAL_OWNER`.
3. **Never commit:** Private keys, mnemonics, or OAuth client secrets. Store only in deploy dashboards (Render, Vercel) and password manager.

---

## Backup holder

Designate one **backup holder** (co-founder or trusted ops lead) before public URL:

| Responsibility | Primary | Backup |
|----------------|---------|--------|
| Day-to-day moderation / jury / recovery | Primary zkLogin wallet | Read-only until invoked |
| Emergency AdminCap transfer | Primary | Receives object if primary is compromised |
| Env secret rotation | Primary | Can update Render/Vercel with repo access |

**Backup setup checklist**

When a backup holder is named, set on Render (optional env, clears Launch Ops warning):

```text
NAMI_ADMIN_CAP_BACKUP_HOLDER=0xBACKUP_WALLET_ADDRESS
```

```text
[ ] Backup wallet address recorded offline (not in git)
[ ] Backup holder can sign Sui transactions independently
[ ] Transfer procedure rehearsed on testnet (AdminCap `public_transfer` if policy allows)
[ ] Google OAuth recovery email documented for primary owner account
[ ] Incident contact list (primary + backup + infra)
```

---

## Key management

```text
Primary owner:     zkLogin-derived Sui address (no exported seed)
Backup holder:     Hardware wallet or air-gapped key — address only in runbook
Treasury:          Separate wallet from AdminCap — testnet `0x6bff7988b87ffce3af4eaee7853f77b6d0d9ebb0e70a2a5924e5bdc7f68c75b4`
Publish wallet:    Used once per republish; fund minimally on testnet
```

**Rotation**

- Rotate `NAMI_OFFICIALS_SYNC_SECRET` and payment provider keys on compromise suspicion.
- Changing `NAMI_OFFICIAL_OWNER` requires on-chain AdminCap transfer **and** env updates on Render + Vercel + OAuth console.

---

## Loss scenarios

| Scenario | Impact | Response |
|----------|--------|----------|
| Primary zkLogin lost | Cannot sign owner UI actions | Use Google account recovery; re-derive same address if salt unchanged |
| AdminCap object lost / burned | Permanent protocol admin lockout | Requires package republish + migration — treat as Sev-1 |
| Backup holder unavailable | Delayed emergency response | Document tertiary contact; pause public URL until resolved |
| Env leak (sync secret) | Unauthorized officials merge | Rotate secret; audit `officials-submissions.json` projection |

---

## Pre-launch verification

```bash
node scripts/verify-testnet-ready.mjs
node scripts/verify-public-deploy.mjs
```

Confirm:

```text
NAMI_OFFICIAL_OWNER matches connected owner wallet in Settings
AdminCap object owned by that address (Sui explorer)
VITE_NAMI_DEMO_OWNER unset
NAMI_PAYMENT_ALLOW_MOCK=false
```

---

## Related docs

- [admin.md](./admin.md) — AdminCap authority matrix
- [security-audit.md](./security-audit.md) — adversarial checks
- [testnet-launch-checklist.md](./testnet-launch-checklist.md) — deploy steps
- [recovery.md](./recovery.md) — member recovery (distinct from owner custody)
# Nami Security Audit — Owner Authority

## Purpose

Document adversarial checks for **sole-owner control** during the MVP phase. The official Nami owner (AdminCap holder) must be the only actor who can perform sensitive platform operations.

---

## On-Chain (Move)

### Status

```text
80 tests passing (includes AdminCap custody hardening)
0 warnings
```

### AdminCap custody

`AdminCap` is an owned object transferred to the package publisher at init. Sensitive `admin.move` entry points require `&AdminCap`, so callers without custody cannot invoke:

```text
Pro / Elite upgrades
Moderation (warning, mute, channel ban, black passport)
Appeal resolution
Jury open / close
Badge issuer approval
Cosmetic grants
Recovery resolution
Channel verification
```

### Hardening tests (Break-the-System)

```text
test_non_owner_cannot_update_channel
test_non_owner_cannot_create_channel_access_policy
test_non_owner_cannot_update_channel_access_policy
test_non_owner_cannot_update_profile
test_non_owner_cannot_borrow_admin_cap
```

### Residual on-chain risks (MVP)

```text
AdminCap loss = protocol admin lockout (use secure custody + recovery playbook)
No subscription-aware membership yet (upgrades are AdminCap-gated)
No on-chain moderator role separation yet (single AdminCap model)
```

---

## Frontend (Phase 7 UI)

### Owner capability matrix

All sensitive UI actions map to `frontend/src/nami-capabilities.ts` and require `VITE_NAMI_OFFICIAL_OWNER`:

| Capability | Owner only |
|------------|------------|
| Core settings | Yes |
| Official Nami panels | Yes |
| Server maintenance | Yes |
| Nodename claim approval | Yes |
| Ban / lift enforcement | Yes |
| Jury control | Yes |
| Moderator promote / demote | Yes |

Official moderators (local list) are **read-only placeholders** until a future delegated-cap model ships. They cannot approve claims, ban users, or manage moderators in the current UI.

### Fixes applied

```text
saveOfficialModerators → writeOfficialModerators (owner-guarded)
canReviewClaims / canBanMembers → owner-only (removed moderator bypass)
NamiOwnerSettingsPanel → hidden unless official owner wallet is connected
```

### Residual frontend risks (demo / localStorage)

```text
localStorage can be edited in DevTools (demo-only; production must use on-chain AdminCap PTBs)
VITE_NAMI_DEMO_OWNER fallback must not ship to production with owner privileges
Indexer/backend maintenance controls are not wired yet (Phase 2+)
```

### Manual exploit checklist

1. Connect a non-owner wallet → Owner Settings panel must not render.
2. Set `nami.admin.moderators` in localStorage → still cannot pass owner guards without matching `VITE_NAMI_OFFICIAL_OWNER`.
3. Call `addOfficialModerator` from console without owner address → returns false.
4. Approve nodename claims as moderator address → blocked at store layer.

---

## Related Docs

```text
docs/admin.md
docs/access-control.md
docs/membership.md
```
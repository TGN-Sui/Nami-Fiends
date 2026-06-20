# Onboarding

Nami has two entry paths from **Enter Nami**:

| Path | Audience | Doc |
|------|----------|-----|
| **Gamer** | Members / players | This document (Acts 1–3) |
| **Game** | Studios submitting a title | [game-onboarding.md](./game-onboarding.md) |

Gamer flow: **Create** (off-chain draft) → **Claim** (one wallet transaction) → **Verify** (platform links). See [verification.md](./verification.md) for Act 3 and [badge-system.md](./badge-system.md) for what badges can be earned when.

---

## Enter Nami gate

All primary CTAs route through the shared entry gate (`EntryPage.tsx`):

- **Log in or sign up** — zkLogin, email, X, wallet (`EntryLoginPanel.tsx`)
- **Gamer** — `OnboardingPanel.tsx` (Player Score, quiz, passport preview)
- **Game** — `GameOnboardingPanel.tsx` (Trust Score, ticket submit)

Settings → **Feedback** accepts suggestions to Nami Officials (`UserSuggestionsSettingsPanel.tsx`). See [officials-submissions.md](./officials-submissions.md).

---

## Design goals

| Goal | Approach |
|------|----------|
| Low friction at signup | Act 1 is free; no wallet until Act 2 |
| One approval at claim | Single PTB mints core identity objects |
| Readable identity | **Nodename** chosen at claim (see [sui-layer.md](./sui-layer.md)) |
| Honest reputation | `Passport.created_at_ms` anchors achievement eligibility |
| Sybil resistance | Platform ids are one-passport (see verification doc) |

---

## Act 1 — Create (no chain)

User builds a **draft passport** stored locally (and optionally server-side later). Nothing is owned on-chain yet.

### Steps

1. **Display name** — shown on profile and passport card; not the on-chain Nodename.
2. **Gamer quiz** — short questionnaire (placeholder archetypes: MMO, PvP, casual, solo, guild-focused, etc.). Maps to:
   - `Passport.archetype` (on-chain field today)
   - Starting **flavor** badge / card presentation (cosmetic until claim)
3. **Preview** — passport card with clear copy: **“Created, not owned.”** CTA: **Claim on-chain**.

### Draft payload (conceptual)

```ts
interface OnboardingDraft {
  displayName: string;
  quizAnswers: Record<string, string>;
  archetype: number;
  flavorBadgeId?: string;
  createdAtMs: number;
}
```

Persist in `localStorage` key `nami.onboarding.draft` until claim succeeds or user clears.

### Quiz (placeholder)

Exact questions TBD. Initial stub in `frontend/src/onboarding-quiz.ts`:

- Primary play style (MMO / competitive / casual / solo / co-op)
- Social preference (guild-heavy / friends-only / public)
- Platform preference (PC / console / both)

Output: `archetype` u8 aligned with `passport.move` and a preview badge label.

---

## Act 2 — Claim (one transaction)

User connects wallet (or zkLogin) and approves **one** programmable transaction.

### Recommended Move entry (target)

`nami::onboarding::enter_nami(nodename, display_name, archetype, ...)`

Mints in one PTB:

| Object | Module |
|--------|--------|
| Identity | `identity.move` |
| Passport | `passport.move` (`archetype`, `created_at_ms`) |
| Conduct | `conduct.move` |
| Profile | `profile.move` |
| Onboarding Basic badge | `badge.move` (issuer: platform / onboarding cap) |

Also registers **Nodename** → Identity mapping.

Until `enter_nami` exists, frontend may fall back to separate txs (dev only); production path is single PTB.

### Nodename

- User-chosen at claim; rules in [sui-layer.md](./sui-layer.md).
- Distinct from display name (display can change; nodename is stable identity handle).

### After claim

- Draft cleared from local storage.
- `Passport.created_at_ms` is set — **verification and achievement badges only count activity after this timestamp**.
- User directed to Act 3 (Verify) or Hub with “Link platforms” prompt.

---

## Act 3 — Verify

Not part of the claim transaction. User links platforms via OAuth/API proof.

- Phone, X, Steam, Epic, Xbox, etc.
- **Sybil:** each platform account → at most one Passport (ever).
- **Unlink:** removes badges sourced from that platform; XP/rep recalculated; relink does not restore lost badges.

Full rules: [verification.md](./verification.md).

---

## UI placement

| Surface | Behavior |
|---------|----------|
| Landing / Hub CTAs | Enter Nami gate → Gamer or Game role |
| Hub (logged out / no passport) | Enter Nami → Gamer wizard (`OnboardingPanel`) |
| Hub (has passport, unverified) | Banner + link to Verify step |
| Settings → Account | Platform links (`PlatformLinkSettingsPanel`) |
| Settings → Feedback | Suggestions to Nami Officials |

Protocol panels remain separate; onboarding is the **first-run** path for members. Game studios use the parallel game wizard documented in [game-onboarding.md](./game-onboarding.md).

---

## Events (future)

When indexer tracks onboarding:

| Event | When |
|-------|------|
| `onboarding.draft_saved` | Optional server sync |
| `passport.created` | Already emitted on mint |
| `identity.nodename_registered` | Nodename bound |
| `verification.platform_linked` | Act 3 success |

---

## Implementation status

| Piece | Status |
|-------|--------|
| `docs/onboarding.md` | This doc |
| `frontend/src/onboarding-quiz.ts` | Quiz config |
| `frontend/src/onboarding-draft.ts` | Local draft persistence |
| `frontend/src/OnboardingPanel.tsx` | Gamer multi-step wizard |
| `frontend/src/EntryPage.tsx` | Enter Nami gate + role selection |
| `frontend/src/EntryLoginPanel.tsx` | Login flows |
| `frontend/src/player-score.ts` | Gamer Player Score (parallel to game Trust Score) |
| `frontend/src/contact-code-verification-store.ts` | Email/phone code verification |
| `frontend/src/gamer-official-social-auth-store.ts` | Gamer X/Twitch OAuth |
| `nami::onboarding::enter_nami` | Not in contracts yet |
| SDK `enterNamiMoveTarget` / `validateEnterNamiParams` | Ready; frontend builds PTB via `onboarding-tx.ts` |

---

## Related

- [game-onboarding.md](./game-onboarding.md) — studio wizard, Trust Score, tickets
- [officials-submissions.md](./officials-submissions.md) — officials review queues
- [verification.md](./verification.md) — platform linking, sybil, timestamps
- [Trust-Score_rules.md](./Trust-Score_rules.md) — game Trust Score (studios)
- [channel-badge-programs.md](./channel-badge-programs.md) — game channel badge questionnaires
- [badge-system.md](./badge-system.md) — badge types and XP
- [roadmap.md](./roadmap.md) — delivery phases
# Studio Portal UI Flow (Shipped Frontend)

This document describes the **implemented** game studio path in Nami Chat. The expanded Gems questionnaire bank in [questionnaire.md](./questionnaire.md) remains the long-term design reference; the live wizard covers identity, proof, ticket submit, and a short badge questionnaire.

Implementation: `frontend/src/GameOnboardingPanel.tsx`

---

## Philosophy

- **Progressive disclosure** — five acts with a visible progress rail.
- **Live Trust Score** — `GameTrustScorePanel` updates as fields are filled.
- **Official proof only** — X/Twitch via OAuth; email/phone via verification codes.
- **Pre-approval workspace** — hidden channel, limited owner tools until full approval.

---

## Enter Nami → Game path

1. User opens **Enter Nami** from landing or Hub CTAs.
2. Chooses **Game** on the role selector (`OnboardingRoleSelector.tsx`).
3. Completes the five-act wizard below.

Member (Gamer) path is documented in [onboarding.md](./onboarding.md).

---

## Act 1 — Identity

| Field | Required |
|-------|----------|
| Game title | Yes |
| Studio / publisher | Yes |
| Primary contact | Yes |
| Business email | Optional (verify if filled) |
| Phone | Optional (verify if filled; not sent to officials) |

---

## Act 2 — Official accounts

| Requirement | Detail |
|-------------|--------|
| Platform | Official **X** or **Twitch** (radio) |
| Authorization | `GameOfficialSocialAuthControl` — no manual handles |
| Wallet | zkLogin via `ZkLoginConnectControl` |

---

## Act 3 — Game proof

| Field | Detail |
|-------|--------|
| Genres | Multi-select (23 IGDB lounges) |
| Website | Optional |
| Store URLs | Steam, Epic, Xbox, PlayStation, Other — each optional |
| Trailer | Optional |

---

## Act 4 — Submit ticket

- **Ticket preview** lists filled contact, social, genre, and link fields.
- Trust Score and pre-approval eligibility shown.
- Submit creates a ticket in `nami.game.submission.tickets`.
- Status: `preapproved` if score ≥ 60%, else `submitted`.

---

## Act 5 — Studio questionnaire (pre-approval)

Unlocked after pre-approved submit. Questions from `game-studio-questionnaire.ts`.

After questionnaire (or **Enter Nami** from review), owner enters the provisional hidden channel.

---

## Post-submit: pre-approved workspace

On owned provisional channel:

| Available | Locked |
|-----------|--------|
| Profile / about editing | Promotion purchases |
| Hidden event drafts | Partner banner submit |
| Banner cover uploads | Super Banner sends |
| Questionnaire | Channel emoji uploads |

See `game-owner-approval-guards.ts`.

---

## Full approval

1. Official **Approve** in Settings → Advanced → Submissions.
2. Approval email + `GameApprovalWelcomeOverlay` (APPROVED! → questionnaire prompt).
3. Hidden events publish to the channel.

---

## Officials review

Settings → Advanced → **Submissions** — see [officials-submissions.md](./officials-submissions.md).

---

## Key files

```text
GameOnboardingPanel.tsx
game-onboarding-draft.ts
game-trust-score.ts
game-submission-ticket-store.ts
game-ticket-preview.ts
game-owner-session-store.ts
GameApprovalWelcomeOverlay.tsx
NamiOfficialsSubmissionsPanel.tsx
```

---

## Related

- [game-onboarding.md](./game-onboarding.md)
- [Trust-Score_rules.md](./Trust-Score_rules.md)
- [questionnaire.md](./questionnaire.md)
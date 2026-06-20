# Game Trust Score Rules (Implemented)

The **Game Trust Score** (0–100) is calculated in `frontend/src/game-trust-score.ts` during game studio onboarding. It drives ticket queue priority and pre-approval eligibility.

**Pre-approval threshold:** `60` (`GAME_PREAPPROVAL_THRESHOLD`)

---

## Categories

| Category | Max points | Label |
|----------|------------|-------|
| Identity & Legitimacy | 40 | Studio identity, contact, verified email/phone, website |
| Game Proof & Publication | 30 | Genres, store links, trailer |
| Community & Validation | 20 | Official X/Twitch authorization |
| Technical & Integration | 10 | Wallet / zkLogin, social authorization bonus |

Total is capped at **100**.

---

## Identity & Legitimacy (max 40)

| Booster | Points | Condition |
|---------|--------|-----------|
| Game title on file | +6 | Title ≥ 2 characters |
| Studio / publisher name | +8 | Studio name ≥ 2 characters |
| Primary contact | +6 | Contact name ≥ 2 characters |
| Verified business email | +8 | Valid email + code verified |
| Phone verified | +6 | Valid phone + code verified |
| Official website | +6 | Valid http(s) URL |

Unverified email or phone earns **0** points and surfaces a suggestion to verify.

---

## Game Proof & Publication (max 30)

| Booster | Points | Condition |
|---------|--------|-----------|
| Game genre(s) selected | +5 | At least one genre from IGDB lounge list |
| Steam store linked | +4 | Valid URL (counts toward store cap) |
| Epic Games store linked | +4 | Valid URL |
| Xbox store linked | +4 | Valid URL |
| PlayStation store linked | +4 | Valid URL |
| Other store linked | +3 | Valid URL |
| Trailer / gameplay video | +10 | Valid URL |

**Store link cap:** combined store points max **15** per ticket.

---

## Community & Validation (max 20)

| Booster | Points | Condition |
|---------|--------|-----------|
| Authorized official X or Twitch | +14 | OAuth verified + handle on file |

---

## Technical & Integration (max 10)

| Booster | Points | Condition |
|---------|--------|-----------|
| zkLogin wallet linked | +8 | Wallet linked via zkLogin |
| Wallet linked (other) | +5 | Wallet linked (non-zkLogin) |
| Official social authorization complete | +2 | Social OAuth verified |

---

## Tier labels

| Total | Tier |
|-------|------|
| 0–40 | Basic |
| 41–70 | Verified |
| 71–100 | Premium |

---

## Pre-approval

| Score | Effect |
|-------|--------|
| ≥ 60 | `preapprovalEligible: true`; ticket status can be `preapproved`; studio questionnaire unlocks |
| < 60 | Ticket queues as `submitted` for manual review |

Tickets are sorted **highest Trust Score first** in the officials queue.

---

## Privacy rules

- Phone contributes to Trust Score locally only.
- Officials-facing tickets never include phone (`buildOfficialGameSubmissionTicket`).
- Ticket preview shows only fields the studio filled in.

---

## Implementation

```text
frontend/src/game-trust-score.ts
frontend/src/game-trust-score.test.ts
frontend/src/GameTrustScorePanel.tsx
```

Tests: `npm --prefix frontend test -- game-trust-score`

---

## Related

- [game-onboarding.md](./game-onboarding.md)
- [officials-submissions.md](./officials-submissions.md)
- [questionnaire.md](./questionnaire.md) — expanded design bank (not all fields are in the live wizard yet)
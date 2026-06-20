# Game Studio Onboarding

Game onboarding is the studio path inside **Enter Nami**. It collects identity proof, official social authorization, publication links, and a Trust Score before Nami Officials review the submission.

Implementation lives in `frontend/src/GameOnboardingPanel.tsx` with draft persistence in `game-onboarding-draft.ts` and ticket storage in `game-submission-ticket-store.ts`.

---

## Entry and role selection

| Surface | Behavior |
|---------|----------|
| Landing / Hub CTAs | Open the shared **Enter Nami** gate (`EntryPage.tsx`) |
| Role selector | **Gamer** → member onboarding; **Game** → game onboarding |
| Login | zkLogin, email, X, or wallet via `EntryLoginPanel.tsx` |

Game onboarding is separate from the three-act member passport flow documented in [onboarding.md](./onboarding.md).

---

## Wizard acts

| Act | Label | Required before continue |
|-----|-------|--------------------------|
| 1 | Identity | Game title, studio, contact; optional verified email/phone |
| 2 | Official accounts | Official X or Twitch OAuth + zkLogin wallet |
| 3 | Game proof | Genres, optional website, per-store URLs, trailer |
| 4 | Submit ticket | Ticket preview + submit to Nami Officials |
| 5 | Questionnaire | Studio badge questionnaire (pre-approval only) |

Draft key: `nami.game.onboarding.draft`

---

## Identity and contact verification

- **Email** and **phone** are optional. Blank fields skip Trust Score points for that channel.
- If a value is entered, the user must verify it with a one-time code (`contact-code-verification-store.ts`) before continuing.
- **Phone never ships to officials.** It stays on-device for Trust Score only. Tickets use `buildOfficialGameSubmissionTicket()` which forces `phone: ''`.

---

## Official social proof

Studios choose **X** or **Twitch**, then authorize through the official OAuth authorizer (`GameOfficialSocialAuthControl.tsx`). Handles cannot be typed manually.

---

## Game proof fields

| Field | Notes |
|-------|-------|
| Genres | Multi-select from the 23 IGDB genre lounges (`game-genres.ts` / `landing-content.ts`) |
| Website | Optional URL |
| Steam store | Optional URL |
| Epic Games store | Optional URL |
| Xbox store | Optional URL |
| PlayStation store | Optional URL |
| Other store | Optional free-text URL |
| Trailer | Optional URL |

Legacy single `storePageUrl` drafts migrate to `steamStoreUrl` on load.

---

## Ticket preview

The review step renders only filled fields via `buildGameTicketPreviewFields()` (`game-ticket-preview.ts`):

- Studio, contact, email
- Genre(s)
- Verified official X/Twitch
- Website, trailer
- Each store URL (labeled)

Trust Score and pre-approval eligibility are shown on the same card.

---

## Trust Score and pre-approval

See [Trust-Score_rules.md](./Trust-Score_rules.md) for the live scoring table.

| Threshold | Effect |
|-----------|--------|
| **60%** (`GAME_PREAPPROVAL_THRESHOLD`) | Pre-approval eligible; questionnaire unlocks after submit |
| **71%+** | Premium tier label |
| **41–70** | Verified tier label |
| **0–40** | Basic tier label |

Tickets queue for Nami Officials sorted by Trust Score (highest first).

---

## Pre-approved workspace

When `approvalStatus === 'preapproved'` (`game-owner-session-store.ts`):

| Allowed | Locked until full approval |
|---------|---------------------------|
| Hidden event drafts | Promotion purchases |
| Banner cover uploads | Partner banner ticket submit |
| Channel profile editing | Super Banner sends |
| Studio questionnaire | Channel emoji uploads |

Pre-approved owners keep the normal app chrome (sidebar, logo, top-right profile). Workspace restrictions apply on the owned channel via `game-owner-approval-guards.ts`.

`submitted` tickets do **not** count as pre-approved workspace.

---

## Full approval flow

1. Nami Official marks ticket **approved** in the submissions queue.
2. Approval email sent (`game-approval-email-store.ts`).
3. **APPROVED!** welcome overlay → one more step → badge questionnaire (`GameApprovalWelcomeOverlay.tsx`).
4. Hidden channel events become visible (`events-store.ts`).

---

## Key modules

```text
frontend/src/GameOnboardingPanel.tsx
frontend/src/game-onboarding-draft.ts
frontend/src/game-trust-score.ts
frontend/src/game-submission-ticket-store.ts
frontend/src/game-ticket-preview.ts
frontend/src/game-genres.ts
frontend/src/game-owner-session-store.ts
frontend/src/game-owner-approval-guards.ts
frontend/src/game-studio-questionnaire.ts
frontend/src/GameApprovalWelcomeOverlay.tsx
frontend/src/GameSubmissionTicketsPanel.tsx
```

---

## Related

- [Trust-Score_rules.md](./Trust-Score_rules.md)
- [officials-submissions.md](./officials-submissions.md)
- [Studio-portal-UI-flow.md](./Studio-portal-UI-flow.md)
- [questionnaire.md](./questionnaire.md)
- [channel-badge-programs.md](./channel-badge-programs.md)
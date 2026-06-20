# Nami Frontend

## Purpose

The frontend is the gamer-facing Nami app: landing page, Enter Nami onboarding (Gamer + Game), Passport/Profile UI, Game Hub, channels, chat, and owner tools.

---

## Quick start

```bash
cd frontend
npm install
npm run dev
```

## Verify

```bash
npm run typecheck   # TypeScript
npm test            # 133 unit tests (vitest)
npm run build       # Production bundle
```

---

## Enter Nami

| Path | Panel | Stores |
|------|-------|--------|
| Gamer | `OnboardingPanel.tsx` | `onboarding-draft.ts`, `player-score.ts` |
| Game | `GameOnboardingPanel.tsx` | `game-onboarding-draft.ts`, `game-trust-score.ts` |
| Login | `EntryLoginPanel.tsx` | `member-session-store.ts`, `wallet.ts` |
| Gate | `EntryPage.tsx` | Role selector + hub entry |

Game Trust Score rules: [docs/Trust-Score_rules.md](../docs/Trust-Score_rules.md)

---

## Settings sections

| Section | Key panels |
|---------|------------|
| Overview | Safety snapshot, shortcuts |
| Account | Profile, passport, platform links |
| Membership | Plans, demo perspectives |
| Feeds | Embedded feed toggles |
| **Feedback** | `UserSuggestionsSettingsPanel` → Nami Officials |
| Safety | Safety Center, tag notifications |
| Appearance | Themes, channel brand palette |
| Advanced (official owner) | Assets, emojis, **Submissions**, security, indexed data |

`requestSettingsSection('feedback')` from `settings-navigation.ts` deep-links sections.

---

## Officials (official owner)

Settings → Advanced → **Submissions** (`NamiOfficialsSubmissionsPanel.tsx`):

- User suggestions
- Game tickets (Trust Score queue)
- Partner banner submissions

See [docs/officials-submissions.md](../docs/officials-submissions.md).

---

## Game studio modules

```text
src/GameOnboardingPanel.tsx
src/game-onboarding-draft.ts
src/game-trust-score.ts
src/game-submission-ticket-store.ts
src/game-ticket-preview.ts
src/game-genres.ts
src/game-owner-session-store.ts
src/game-owner-approval-guards.ts
src/GameApprovalWelcomeOverlay.tsx
src/GameSubmissionTicketsPanel.tsx
src/GameOfficialSocialAuthControl.tsx
src/contact-code-verification-store.ts
```

---

## Landing page copy

Edit marketing text in `src/landing-content.ts`. See [docs/landing-page.md](../docs/landing-page.md).

Hub polish (bubbles, spotlight, tile strip): [docs/ui-build-checkpoint.md](../docs/ui-build-checkpoint.md).

---

## Config flags

`src/app-config.ts`:

| Env | Purpose |
|-----|---------|
| `VITE_NAMI_DEV_FIXTURES` | Seed catalog fixtures |
| `VITE_NAMI_TEST_LAUNCH` | Test-launch gating |
| `VITE_NAMI_INDEXER_URL` | Live indexer base URL |
| `VITE_NAMI_OFFICIAL_OWNER` | Official owner wallet for admin surfaces |

Protocol wiring to Sui is partial; providers fall back to fixtures when offline.

---

## Related docs

```text
docs/README.md
docs/game-onboarding.md
docs/onboarding.md
docs/ui-build-checkpoint.md
```
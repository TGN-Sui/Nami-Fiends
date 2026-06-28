# Nami Arcade — Cabinet Flow (Phase 7)

Goonies-style walk-up arcade inside the Game Hub: attract screen → cabinet picker → fullscreen intro → stage loop → playable cabinet.

Related: [game-onboarding.md](./game-onboarding.md) · [ui-build-checkpoint.md](./ui-build-checkpoint.md) · [walrus-sites-deploy.md](./walrus-sites-deploy.md) (static host includes `frontend/public/arcade/**`)

---

## Player flow

```text
attract (PRESS START)
  → cabinet-select (8 machines, tier/membership gated)
  → cabinet-intro (fullscreen MP4, no skip on first walk-up)
  → cabinet-active (CRT stage + cabinet menu / play session)
```

During an active run, lobby music ducks or pauses; per-game MP3 replaces it when configured.

Escape during intro returns to the picker. Exit from play returns to the cabinet menu or picker depending on phase.

---

## Live Tier 1 cabinets

| Cabinet id | Game id | Modes | Notes |
|------------|---------|-------|-------|
| `goon-pop` | `nami-bubble-pop` | Alley Run / Heat Run | 60s bubble pop; G scoring; crew-themed labels |
| `alley-push` | `nami-alley-push` | Street Pass / Heat Chase | 5 horizontal lanes; crew pass scoring |

All other cabinets in `arcade-cabinets.ts` render as **LOCKED** (membership) or **OFFLINE** (no `gameId` yet).

---

## Per-cabinet media (not per-game)

Intro, stage, and CRT viewport resolve by **cabinet id**:

| Slot id | Kind | Public fallback |
|---------|------|-----------------|
| `arcade-cabinet-{id}-intro` | Walk-up MP4/WebM | `/arcade/cabinets/{id}/intro.mp4` |
| `arcade-cabinet-{id}-stage` | Looping stage MP4/WebM | `/arcade/cabinets/{id}/stage.mp4` |
| `arcade-cabinet-{id}-viewport` | CRT interior image/video | — (uses global arcade background) |

Owner uploads in the artwork catalog override public fallbacks. Only **game music** remains per `gameId` (`arcade-game-music-{gameId}`).

---

## Alley Push — Heat Chase vertical rows

**Street Pass:** one traffic row per lane; three staggered hazard waves enter from off-screen edges.

**Heat Chase:** three hazard rows per traffic lane (top / middle / bottom). The player steps between rows with ↑↓ before crossing lanes:

- ↑ at the top row of a lane enters the **next** lane on its **bottom** row (must clear every row).
- ↓ at the bottom row drops to the **previous** lane on its **top** row.
- Collisions are track-aware — a top-row hazard does not hit a player on the middle or bottom row.

---

## Scoring and persistence

| Game | Leaderboard key | Passport stats key |
|------|-----------------|-------------------|
| Goon Pop | `nami.arcade.bubble-leaderboard` | `nami.arcade.bubble-passport-stats` |
| Alley Push | `nami.arcade.alley-push-leaderboard` | `nami.arcade.alley-push-passport-stats` |

Cabinet picker high scores read both modes per game (`N … · H …` or `S … · H …`).

---

## Key frontend files

| Area | Files |
|------|-------|
| Registry + gating | `arcade-cabinets.ts`, `nami-arcade-games.ts` |
| Screen flow | `ArcadeScreen.tsx`, `ArcadeCabinetSelect.tsx`, `ArcadeCabinetIntro.tsx` |
| Play session | `ArcadeCabinetPlaySession.tsx`, `ArcadeCabinetGame.tsx` |
| Games | `ArcadeBubbleGame.tsx`, `ArcadeAlleyPushGame.tsx` |
| Media resolve | `arcade-cabinet-media.ts`, `arcade-cabinet-media-store.ts` |
| Stage / CRT | `ArcadeStageBackground.tsx`, `ArcadeBackgroundMedia.tsx`, `arcade-cabinet-stage-fit.ts` |
| Session | `arcade-session-store.ts` |
| Audio | `ArcadeMusicPlayer.tsx`, `ArcadeAudioControls.tsx`, `arcade-music.ts`, `arcade-audio-store.ts` |

---

## Public asset layout

```text
frontend/public/arcade/cabinets/
  goon-pop/intro.mp4
  goon-pop/stage.mp4
  alley-push/intro.mp4
  alley-push/stage.mp4
```

Vite serves these at `/arcade/cabinets/...` in dev and copies them into `frontend/dist` for Walrus Sites / Vercel builds.

---

## Verification

```bash
npm --prefix frontend run typecheck
npm --prefix frontend test -- src/arcade-cabinets.test.ts src/arcade-cabinet-intro.test.ts src/arcade-cabinet-media.test.ts src/arcade-alley-push-game.test.ts src/arcade-bubble-game.test.ts src/nami-arcade-games.test.ts
```
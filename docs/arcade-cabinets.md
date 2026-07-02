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

## Live cabinets

| Cabinet id | Game id | Tier | Modes | Notes |
|------------|---------|------|-------|-------|
| `goon-pop` | `nami-bubble-pop` | 1 | Alley Run / Heat Run | 60s bubble pop; G scoring; crew-themed labels |
| `alley-push` | `nami-alley-push` | 1 | Street Pass / Heat Chase | 5 horizontal lanes; crew pass scoring |
| `stash-defense` | `nami-stash-defense` | 2 (Pro) | Alley Watch / Heat Siege | 3 lanes; push raiders before they hit the stash |
| `drop-window` | `nami-drop-window` | 2 (Pro) | Clean Signal / Static Storm | 3 windows; catch DROP signals, kill STATIC noise |
| `hawkeye-gallery` | `nami-bricked-up` | 2 (Pro) | Street Break / Heat Layer / Skill Diff | Brick breaker; mystery drops; falling hazards; overlapping power effects |
| `stealth-goon` | `nami-stealth-goon` | 2 (Pro) | Low Profile / Heat Patrol / Skill Diff | Grid snake / squad chain; collect crew links; dodge HEAT patrols |
| `squid-market` | `nami-gob-market` | 3 (Elite) | Guest List / VIP Floor / Skill Diff | 15×15 maze; collect list tokens; dodge bouncers; 3 lives |
| `intel-stack` | `nami-intel-stack` | 3 (Elite) | Clean Stack / Surge Stack / Skill Diff | 3–5 signal towers; stack pulses before expiry; tower height tracks misses |

All other cabinets in `arcade-cabinets.ts` render as **LOCKED** (membership) or **OFFLINE** (no `gameId` yet).

---

## Per-cabinet media (not per-game)

Intro, stage, and CRT viewport resolve by **cabinet id**:

| Slot id | Kind | Public fallback |
|---------|------|-----------------|
| `arcade-cabinet-{id}-intro` | Walk-up MP4/WebM | `/arcade/cabinets/{id}/intro.mp4` |
| `arcade-cabinet-{id}-stage` | Looping stage MP4/WebM | `/arcade/cabinets/{id}/stage.mp4` |
| `arcade-cabinet-{id}-viewport` | CRT interior image/video | — (uses global arcade background) |

Owner uploads override public fallbacks. **Platform** artwork (badges, logos, nav icons) lives in Settings → **Visual assets**. **Arcade** shell, music, cabinet media, and Bricked Up sprites live in Settings → **Arcade media** (`NamiOwnerArcadeAssetEditPanel.tsx`, sections from `readArcadeOwnerAssetSlotSections()`). Only **game music** remains per `gameId` (`arcade-game-music-{gameId}`).

### Stage fit (`stageFit` in `arcade-cabinets.ts`)

During `cabinet-active`, each machine applies per-cabinet `scaleX`, `scaleY`, `offsetX`, and `offsetY` so the CRT box aligns with the stage video closeup. CSS vars are written on `.nami-arcade-box` via `arcadeCabinetStageFitBoxStyle()`. Tune offsets in the registry, then hard-refresh and verify on the live stage loop.

| Cabinet id | scaleX | scaleY | offsetX | offsetY | Notes |
|------------|--------|--------|---------|---------|-------|
| `goon-pop` | 1.6 | 1.49 | 3.5% | 1.5% | Tier 1 reference fit |
| `alley-push` | 1.6 | 1.49 | 3.5% | 1.5% | Matches Goon Pop |
| `stash-defense` | 1.54 | 1.482 | 4% | −1% | Pro tier |
| `drop-window` | 1.55 | 1.469 | 5% | −0.5% | Pro tier |
| `hawkeye-gallery` | 1.528 | 1.476 | 4.5% | −1.5% | Bricked Up |
| `stealth-goon` | 1.52 | 1.5 | 2.5% | −2% | Pro tier |
| `squid-market` | 1.52 | 1.469 | 3% | −1.5% | Gob Market maze |
| `intel-stack` | 1.545 | 1.553 | 3.5% | −2% | Tuned 2026-07 — widened CRT; playfield uses flex grid so Stack buttons are not clipped |

**Intel Stack viewport:** `.arcade-intel-stack-game` uses `grid-template-rows: auto minmax(0, 1fr) auto` (no rigid `min-height` on the field or towers) so column **Stack** buttons stay inside the CRT viewport when `overflow: hidden` is active on the shell. Stage-fit overrides live under `[data-active-cabinet-id='intel-stack']` in `phase7-ui.css`.

---

## Alley Push — Heat Chase vertical rows

**Street Pass:** one traffic row per lane; three staggered hazard waves enter from off-screen edges.

**Heat Chase:** three hazard rows per traffic lane (top / middle / bottom). The player steps between rows with ↑↓ before crossing lanes:

- ↑ at the top row of a lane enters the **next** lane on its **bottom** row (must clear every row).
- ↓ at the bottom row drops to the **previous** lane on its **top** row.
- Collisions are track-aware — a top-row hazard does not hit a player on the middle or bottom row.

---

## Stash Defense — lane push defense

**Alley Watch:** one raider per lane, slower spawns, longer push cooldown, 5 stash HP.

**Heat Siege:** two raiders per lane, faster spawns, tighter push cooldown, 3 stash HP.

Enemies march right → left toward the stash. Push with `1/2/3` or `Q/W/E` when a raider is in the push zone (right of the stash column). +2 G per repel, −1 G per stash hit, +8 G bonus for surviving the full 60s.

---

## Drop Window — reaction windows

**Clean Signal:** longer DROP/STATIC windows, slower spawns, fewer static decoys.

**Static Storm:** tighter windows, faster spawns, more static noise.

One signal flashes in a random window at a time. Catch golden **DROP** in the matching window (+4 G). Kill red **STATIC** in the matching window (+2 G). Wrong window, missed drop, or missed static costs G. +8 G bonus for surviving the full 60s with score above zero.

---

## Bricked Up — brick breaker

**Street Break:** 3 levels, standard ball speed, mystery drops and shard hazards.

**Heat Layer:** 4 levels, faster ball, denser hazards, reinforced bricks (up to 2 HP).

**Skill Diff:** 5 levels, dual balls (staggered serve), armored bricks (2–3 HP), faster hazards.

Break bricks for +2 G each. Mystery drops roll power-ups or power-downs; timed effects overlap and fade on their own countdown. Explosive hazards only spawn during the **Explosive Rain** power-down. Clear all levels for +10 G per floor and +24 G wall bonus. Owner-editable sprite slots cover bricks, paddle, ball, hazards, drops, projectiles, and explosions.

---

## Stealth Goon — squad chain

**Low Profile:** slower chain growth, no patrol heat.

**Heat Patrol:** faster chain, two roaming HEAT agents.

**Skill Diff:** fastest chain, dense patrol heat.

Steer with arrow keys or WASD. Each crew link extends the chain for +2 G. Wall, self, or HEAT collisions end the run. +8 G bonus for surviving the full 60s with score above zero.

---

## Gob Market — VIP maze collect

**Guest List:** open maze, no bouncers, slower pace.

**VIP Floor:** two roaming bouncers, faster pace, 3 lives.

**Skill Diff:** four bouncers, fastest pace, dense heat.

Steer with arrow keys or WASD. Each list token banks +3 G. Bouncer hits cost a life and respawn at the entrance. +8 G bonus for surviving the full 60s with score above zero.

The 15×15 maze is **fully connected** from spawn `(1, 1)` — every open floor tile is reachable so list tokens never spawn in sealed pockets (`listArcadeGobMarketOpenCellsFrom()` + connectivity tests in `arcade-gob-market-game.test.ts`).

---

## Intel Stack — signal tower puzzle

**Clean Stack:** three towers, longer signal life, single concurrent pulse.

**Surge Stack:** faster spawns, shorter windows, missed signals trim tower height.

**Skill Diff:** five towers, up to two concurrent pulses, perfect timing near expiry banks +5 G.

Press `1–3` / `QWE` (or `4–5` / `RT` in Skill Diff) to commit the active pulse into the matching tower before it flatlines. Clean stacks bank +3 G, late stacks +1 G, perfect stacks +5 G. Missed signals cost −2 G and remove one tower block. +8 G bonus for surviving the full 60s above zero.

---

## Passport badges (arcade runs)

After each run, `applyArcadePassportBadgesAfterRun` evaluates cumulative passport stats and grants local badges (e.g. cabinet debuts, Skill Diff Survivor, Crew Record, Glow Ghoster, Arcade Regular). Earned badges merge into the self member Badge Book via `getUserCollectedBadges()`.

---

## Scoring and persistence

| Game | Leaderboard key | Passport stats key |
|------|-----------------|-------------------|
| Goon Pop | `nami.arcade.bubble-leaderboard` | `nami.arcade.bubble-passport-stats` |
| Alley Push | `nami.arcade.alley-push-leaderboard` | `nami.arcade.alley-push-passport-stats` |
| Stash Defense | `nami.arcade.stash-defense-leaderboard` | `nami.arcade.stash-defense-passport-stats` |
| Drop Window | `nami.arcade.drop-window-leaderboard` | `nami.arcade.drop-window-passport-stats` |
| Bricked Up | `nami.arcade.bricked-up-leaderboard` | `nami.arcade.bricked-up-passport-stats` |
| Stealth Goon | `nami.arcade.stealth-goon-leaderboard` | `nami.arcade.stealth-goon-passport-stats` |
| Gob Market | `nami.arcade.gob-market-leaderboard` | `nami.arcade.gob-market-passport-stats` |
| Intel Stack | `nami.arcade.intel-stack-leaderboard` | `nami.arcade.intel-stack-passport-stats` |

Cabinet picker high scores read both modes per game (`N … · H …`, `S … · H …`, `W … · S …`, `C … · S …`, `B … · H … · D …`, `L … · H … · D …`, `G … · V … · D …`, or `C … · S … · D …`). Arcade badge grants persist in `nami.arcade-badge-grants`.

---

## Key frontend files

| Area | Files |
|------|-------|
| Registry + gating | `arcade-cabinets.ts`, `nami-arcade-games.ts` |
| Screen flow | `ArcadeScreen.tsx`, `ArcadeCabinetSelect.tsx`, `ArcadeCabinetIntro.tsx` |
| Play session | `ArcadeCabinetPlaySession.tsx`, `ArcadeCabinetGame.tsx` |
| Games | `ArcadeBubbleGame.tsx`, `ArcadeAlleyPushGame.tsx`, `ArcadeStashDefenseGame.tsx`, `ArcadeDropWindowGame.tsx`, `ArcadeBrickedUpGame.tsx`, `ArcadeStealthGoonGame.tsx`, `ArcadeGobMarketGame.tsx`, `ArcadeIntelStackGame.tsx` |
| Media resolve | `arcade-cabinet-media.ts`, `arcade-cabinet-media-store.ts` |
| Stage / CRT | `ArcadeStageBackground.tsx`, `ArcadeBackgroundMedia.tsx`, `arcade-cabinet-stage-fit.ts` |
| Owner uploads | `NamiOwnerArcadeAssetEditPanel.tsx`, `OwnerAssetSlotCatalog.tsx`, `nami-owner-assets-store.ts` |
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
  stash-defense/intro.mp4
  stash-defense/stage.mp4
  drop-window/intro.mp4
  drop-window/stage.mp4
  hawkeye-gallery/intro.mp4
  hawkeye-gallery/stage.mp4
  stealth-goon/intro.mp4
  stealth-goon/stage.mp4
  squid-market/intro.mp4
  squid-market/stage.mp4
  intel-stack/intro.mp4
  intel-stack/stage.mp4
```

Vite serves these at `/arcade/cabinets/...` in dev and copies them into `frontend/dist` for Walrus Sites / Vercel builds.

---

## Verification

```bash
npm --prefix frontend run typecheck
npm --prefix frontend test -- src/arcade-cabinets.test.ts src/arcade-cabinet-intro.test.ts src/arcade-cabinet-media.test.ts src/arcade-cabinet-stage-fit.test.ts src/arcade-alley-push-game.test.ts src/arcade-bubble-game.test.ts src/arcade-stash-defense-game.test.ts src/arcade-drop-window-game.test.ts src/arcade-bricked-up-game.test.ts src/arcade-bricked-up-sprites.test.ts src/arcade-stealth-goon-game.test.ts src/arcade-gob-market-game.test.ts src/arcade-intel-stack-game.test.ts src/arcade-passport-badge-hooks.test.ts src/nami-arcade-games.test.ts src/nami-owner-assets-store.test.ts src/settings-navigation.test.ts
```
# Nami Chat UI Build Checkpoint

Status: **Phase 8 in progress** — Phase 7 complete (`347511f`); entry gate, game onboarding, officials submissions, and pre-approval workspace shipped (`dd96c12`). Post-Phase 7 owner-settings and media-persistence wave shipped. Sidebar, global chat, and profile polish wave shipped (`9c417a4`). Launch ops dashboard + discovery tab wiring shipped. **297** frontend unit tests passing.

This checkpoint records the completed frontend UI polish pass for Nami Chat, the shipped Phase 7 product surfaces, and the unified architecture prepared for test launch. It confirms the current UI build is clean, provider-backed where the receiving server is live, and aligned with the project rule that paid features add capability or customization only and never create verification or trust.

## Completed UI Scope

| Phase | Status | Result |
| --- | --- | --- |
| UI-A19 | Complete | Member Spotlight and sidebar avatar polish. |
| UI-A20.1 | Complete | Ownership mode clarity for owner/member preview states. |
| UI-A20.2 | Complete | Channel Palette member flow with dots-only color selection. |
| UI-A20.3 | Complete | Owner tool action states for operational controls. |
| UI-A20.4 | Complete | Final responsive and accessibility polish. |
| UI-A20.5 | Complete | UI build checkpoint and documentation cleanup. |

## Phase 7 Intake (UI-B21)

| Phase | Status | Result |
| --- | --- | --- |
| UI-B21.1 | Complete | Account sign-in relocated to Settings. |
| UI-B21.2 | Complete | Theme modes: Nami Default, Dark, Light, Custom. |
| UI-B21.3 | Complete | Nami Hub global chats + Elite temporary rooms. |
| UI-B21.4 | Complete | Game Hub genre browser + bottom chat dock. |
| UI-B21.5 | Complete | Embedded social panels (X, Twitch/live). |
| UI-B21.6 | Complete | Passport ↔ Badge Collectors Book swipe carousel. |
| UI-B21.7 | Complete | TCG-style member passport when viewing others. |
| UI-B21.8 | Complete | Membership checkout + backend payment intents API. |
| UI-B21.9 | Complete | Pinned top-right profile avatar with foil + photo. |
| UI-B21.10 | Complete | Live-streaming dot on avatars (top-right inset). |
| UI-B21.11 | Complete | TCG passport vertical layout + tier header polish. |
| UI-B21.12 | Complete | Chat emojis, @tags, notifications, social embeds. |
| UI-B21.22 | Complete | Cross-user AdminCap fulfillment for queued subscriber passports. |

## Test-Launch Polish (Slices 1–10)

| Slice | Status | Result |
| --- | --- | --- |
| Slice 1 | Complete | `app-config`, `protocol-availability`, preference/safety stores, `ProtocolStatusBar`. |
| Slice 2 | Complete | Removed dead demo UI (`UxPreviewConsole`, `MediaUploadPrepCard`, demo tag seed mount). |
| Slice 3 | Complete | `domain/types` + `fixtures/seed-data`; gated `uiMockData` facade. |
| Slice 4 | Complete | `preferences-sync` + `media-upload-service` unified upload paths. |
| Slice 5 | Complete | `affiliation-provider` for guild/squad surfaces. |
| Slice 6 | Complete | Auto-seed gated by `VITE_NAMI_TEST_LAUNCH`. |
| Slice 7 | Complete | `channel-directory-provider` + `member-directory-provider` for Hub / Game Hub. |
| Slice 8 | Complete | Mock checkout and X verification gated behind dev/test policy. |
| Slice 9 | Complete | `IndexedDataPanel` official-owner gate; user-facing protocol copy cleanup. |
| Slice 10 | Complete | Roadmap + checkpoint docs; Phase 7 marked complete. |

## Landing Page Polish

| Commit | Summary |
| --- | --- |
| `6c869e0` | Landing TCG deck, hero visual, uniform horizontal passport, no guest browse |
| `2a66666` | Deck animation, floating genre bubbles, hero passport layout |
| `e9881a1` | Elite passport + glitter, wider cards, deck shift on discard only |
| `85ef2dc` | TCG 2.5″×3.5″ sizing, table overlap, white grid spotlight, varied bubbles |
| `7858c6e` | Sharper spotlight falloff |
| `2858b5f` | Spotlight bloom aligned to cursor pixels |

| `064822d` | Native TCG passport fit, three-card stack, hero headline, landing copy docs |

Copy for the landing page is centralized in `frontend/src/landing-content.ts`. See [landing-page.md](./landing-page.md).

## Post-Phase 7 UI Polish (Game Hub + Profile)

| Area | Summary |
| --- | --- |
| Navigation | Pages scroll to top on every `activePage` change. |
| Ambient | `NamiGridSpotlight` extends landing cursor spotlight to the signed-in app shell. |
| Genre chat | Centered expand overlay; heading/messages no longer overlap. |
| Profile passport | Horizontal carousel centered; avatar/name overlap fixed. |
| Memberships list | Fixed table columns; aligned Open / Invite action grid. |
| My Events | Footer rows aligned (Interested + channel / view actions). |
| Member pinned chat | Compact mode skips presence rail; composer stays visible. |
| Badge Book | Single-scale closed cover, 3D open animation, frame-by-frame spread flips. |

Latest commit for this wave: `04e3631` — Polish Game Hub surfaces and interactive Badge Book.

## Hub Interaction Polish

| Area | Summary |
| --- | --- |
| Hub performance | `CryptoBubbleBoard.tsx` extracted from `App.tsx`; transform-only bubble positioning, spatial-hash collisions, 30fps cap, rAF pauses when idle/offscreen. |
| App spotlight | Dark-mode spotlight contrast tokens; signed-in pages use static `is-nami-app-spotlight-static` (no moving html spotlight on hub surfaces). |
| Bubble highlights | Per-bubble `--bubble-proximity` drives border, glow, brightness, and z-index with smooth cursor falloff (Nami Hub Top 50 + Game Hub genre board). |
| Member Spotlight | Pro/Elite foil, bubble drift, glitter, rainbow border, and Nami Official galaxy motion start on card `:hover` / `:focus-visible` only. |
| Game Hub tiles | `useHorizontalScrollStrip.ts` adds drag momentum + smooth wheel interpolation; strip hard-clips at browser edges (no snap, no right-edge fade). |

Key files: `frontend/src/CryptoBubbleBoard.tsx`, `frontend/src/useHorizontalScrollStrip.ts`, `frontend/src/NamiGridSpotlight.tsx`, `frontend/src/phase7-ui.css`, `frontend/src/styles.css`.

Latest commits for this wave: `6069b6a` (proximity highlights, hover motion, tile scroll) and `99c42c4` (performance baseline).

## Game Channel Profile Redesign (UI-B22)

| Phase | Status | Result |
| --- | --- | --- |
| UI-B22.1 | Complete | Tabbed game channel profile: News, Events, Reviews, About, Chat, Owner. |
| UI-B22.2 | Complete | Shared `ChannelProfileShell` hero + nav; chat lives on the same page (no separate `chat` route). |
| UI-B22.3 | Complete | Clickable news cards + `ChannelNewsDetailOverlay`. |
| UI-B22.4 | Complete | Owner-only channel events publish entry; subscriber Interested flow on profile Events tab. |
| UI-B22.5 | Complete | Badge-gated community reviews (`channel-game-reviews-store`, `ChannelGameReviewsSection`). |
| UI-B22.6 | Complete | Focused banner alerts: editor, owner preview, subscriber popup, reminder bar (`channel-banner-notifications-store`). |
| UI-B22.7 | Complete | Related channel compact cover tiles; profile brand theme helpers. |
| UI-B22.8 | Complete | Store snapshot caching fix for reviews/badges (prevents blank profile from `useSyncExternalStore` loops). |
| UI-B22.9 | Complete | Nami emoji display at standard 28×28px in game channel chat (picker + inline). |

Key files: `ChannelProfileScreen.tsx`, `ChannelProfileShell.tsx`, `ChannelProfileChatSection.tsx`, `channel-profile-sections.ts`, `useChannelProfileChrome.ts`, `channel-banner-notifications-store.ts`, `channel-game-reviews-store.ts`, `channel-game-badge-store.ts`, `phase7-ui.css`.

Verification (UI-B22): `npm --prefix frontend run build` and `npm --prefix frontend test` — **74** unit tests passing.

## Latest UI Commits

| Commit | Summary |
| --- | --- |
| `6069b6a` | Uniform bubble proximity highlights, Member Spotlight hover-only motion, Game Hub tile strip smooth scroll |
| `99c42c4` | Hub performance, dark spotlight contrast, bubble physics (`CryptoBubbleBoard`) |
| `347511f` | Slice 9 operator UX + Hub fixture fallback during discovery load |
| `fdc78bf` | Slice 8 payment/X gating + Game Hub empty-state fix |
| `bda07a4` | Slice 7 channel and member directory providers |
| `7482c2b` | Slice 6 gate local store auto-seeding |
| `413a989` | Slice 5 affiliation provider |
| `9d74b90` | Slice 4 preferences sync + media uploads |
| `71e8b19` | Slice 3 domain types vs fixtures |
| `80cc9f8` | Slice 2 remove dead demo UI |
| `5b32205` | Slice 1 app config + unified stores |
| `dd918d4` | Add Phase 7 UI, owner-only admin caps, membership billing |
| `57746d0` | Add final responsive accessibility polish |
| `a437426` | Polish owner tool action states |
| `57ac68e` | Polish channel colors member flow |
| `3974d4d` | Mount ownership mode clarity UI |
| `6b974b5` | Add ownership mode clarity |
| `aea188d` | Refine member spotlight foil sweep |
| `eac3938` | Polish member spotlight foil effects |
| `f95e69f` | Phase 7 UI-B21 surfaces, guild spaces, spotlight layout polish |
| `324833e` | Cross-user AdminCap membership fulfillment |

## Verification Commands

Phase 7 completion was verified with:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend test
```

All checks passed (47 unit tests at Phase 7 completion; 74 after UI-B22; 133 after Phase 8 onboarding + officials stores; 230 after owner settings, media persistence, and discovery fixes; **296** after guild/squad invites, tags, $GOON tips, and shell polish).

## Phase 8 — Enter Nami + Game Onboarding (UI-C23)

| Slice | Status | Result |
| --- | --- | --- |
| UI-C23.1 | Complete | Enter Nami gate; all Hub/landing CTAs route through entry (`EntryPage.tsx`). |
| UI-C23.2 | Complete | Dual Gamer/Game onboarding; role selector + login (zkLogin, email, X, wallet). |
| UI-C23.3 | Complete | Game Trust Score, contact code verification, official X/Twitch OAuth for studios. |
| UI-C23.4 | Complete | Game ticket preview (genres, per-store URLs, social links); officials queue. |
| UI-C23.5 | Complete | Pre-approval workspace guards; hidden events; approval welcome overlay. |
| UI-C23.6 | Complete | Settings → Feedback suggestions box → officials queue. |
| UI-C23.7 | Complete | Settings → Advanced → Submissions (suggestions, game tickets, partner banners). |
| UI-C23.8 | Complete | Sidebar/profile chrome restored for pre-approved game owners. |

Key files: `GameOnboardingPanel.tsx`, `game-trust-score.ts`, `game-submission-ticket-store.ts`, `nami-user-suggestions-store.ts`, `partner-banner-submission-store.ts`, `NamiOfficialsSubmissionsPanel.tsx`, `UserSuggestionsSettingsPanel.tsx`, `GameApprovalWelcomeOverlay.tsx`.

Docs: [game-onboarding.md](./game-onboarding.md), [officials-submissions.md](./officials-submissions.md), [Trust-Score_rules.md](./Trust-Score_rules.md).

Latest commits: `0b364a3` (ticket preview + genres), `6c93b7c` (officials submissions), `dd96c12` (sidebar fix).

## Post-Phase 7 — Owner Settings + Media Persistence (UI-C24)

| Slice | Status | Result |
| --- | --- | --- |
| UI-C24.1 | Complete | Grouped owner settings (Brand & media, Promotions, Alerts & emojis, Advanced) with tabbed nav. |
| UI-C24.2 | Complete | Unified draft + dirty state; sticky **Save settings** / **Discard** footer. |
| UI-C24.3 | Complete | Focused banner alerts for all game owners (Elite gate removed). |
| UI-C24.4 | Complete | IndexedDB channel media persistence; bootstrap on startup; survives refresh. |
| UI-C24.5 | Complete | Hub partner banner layered cover + scrim (no flat red gradient). |
| UI-C24.6 | Complete | Subscribed + owner-provisioned channels in hub/profile discovery. |
| UI-C24.7 | Complete | Boost cycle visibility for game owners (Settings + pinned profile card). |
| UI-C24.8 | Complete | Settings Account tab render fix (`player-platform-sync-store` snapshot cache). |
| UI-C24.9 | Complete | Wallet copy removed from landing/onboarding; connect in Settings; Buy Goon on profiles. |
| UI-C24.10 | Complete | Upload auth fallback when `wallet_auth_invalid`; local fallback in `media-upload-service`. |

Key files: `ChannelOwnerSection.tsx`, `channel-owner-settings-draft.ts`, `channel-owner-settings-context.tsx`, `channel-owner-settings-groups.ts`, `channel-media-persistence.ts`, `channel-cover-store.ts`, `channel-owner-media-store.ts`, `local-channel-directory.ts`, `subscriptions-store.ts`, `PinnedGameChannelProfileCard.tsx`, `PlatformLinkSettingsPanel.tsx`, `account-connect.tsx`, `GoonQuickBuy.tsx`.

Verification: `npm --prefix frontend run typecheck && npm --prefix frontend test && npm --prefix frontend run build` — **296** unit tests passing.

## Post-Phase 8 — Shell & Chat Polish (UI-C25)

| Slice | Status | Result |
| --- | --- | --- |
| UI-C25.1 | Complete | Sidebar rail scroll, hover labels, 16:9 collapse/radio alignment. |
| UI-C25.2 | Complete | Global chat layout: messages-first column, compact bottom composer. |
| UI-C25.3 | Complete | Game profile navigation fixes; hub triangle hover scale tamed. |
| UI-C25.4 | Complete | Profile edit UX; shared global chat message layer. |
| UI-C25.5 | Complete | Test-launch showcase sidebar; Elite preview for testers. |
| UI-C25.6 | Complete | Member profile guild/squad invites with tier slot caps (25 / 100 / 250). |
| UI-C25.7 | Complete | Buy / Tip $GOON on member profiles (`MemberProfileActions`, treasury-routed tips). |
| UI-C25.8 | Complete | X post embeds fixed at **550×520** (`social-embed.ts`, not 16:9 video sizing). |
| UI-C25.9 | Complete | Live-streaming dot on avatar frame border (`member-avatar-live-shell`). |

Key files: `GlobalChatsPanel.tsx`, `MemberProfileActions.tsx`, `guild-invites-store.ts`, `goon-tips-store.ts`, `social-embed.ts`, `member-avatar.tsx`, `phase7-ui.css`.

Latest commits: `5d878dc` (profile edit + global chat layer), `42f1f02` (global chat layout), `7ce5300` (game profile + sidebar), `9c417a4` (sidebar hover labels + radio sync).

## Product Rules Preserved

- Paid placement, paid subscriptions, Pro, and Elite features do not create verification or trust.
- Verification remains based on identity proofs, SuiNS/subnames, badges, reputation, and approval systems.
- Member Spotlight excludes NPC/Black status members and keeps verified checkmarks reserved for valid verified member states.
- Channel Colors are member-facing cosmetic selections from owner-approved palette options.
- Owner tools are operational controls only. They do not override Nami-controlled proofs, verification, or trust decisions.
- Media uploads route through `media-upload-service` when the receiving server is configured; Walrus proofs remain a later phase.

## Architecture Notes (Test Launch)

- **Config:** `app-config.ts` centralizes env flags (`VITE_NAMI_DEV_FIXTURES`, `VITE_NAMI_TEST_LAUNCH`, indexer URL).
- **Protocol status:** `protocol-availability.ts` exposes Connected / Online / Preview / Setup badges (no user-facing “Mock” label).
- **Providers:** `affiliation-provider`, `channel-directory-provider`, `member-directory-provider` unify live indexer data vs fixture fallback.
- **Fixture policy:** Dev fixtures stay on during polish; live discovery replaces them only when ranked rows return. Hub and Game Hub show fixtures immediately (including while discovery loads).
- **Operator tools:** `IndexedDataPanel` is visible only to `VITE_NAMI_OFFICIAL_OWNER` in Settings → Advanced (Launch Ops + Discovery tabs).

## UI Build Outcome

Phase 7 is complete. Phase 8 entry and game onboarding surfaces are shipped. Owner settings, media persistence, discovery fixes, and shell/chat polish bring the frontend to **296** unit tests passing.

Membership checkout, subscription state, avatar/cover/logo uploads, streaming presence, and directory surfaces sync through the receiving server when `VITE_NAMI_INDEXER_URL` is set, with fixture fallback for offline or empty discovery cycles.

## Phase 6 — Discovery Layer (UI-D26, complete)

| Slice | Status | Result |
| --- | --- | --- |
| UI-D26.1 | Complete | Multi-signal discovery engine (`discovery-scoring.ts`, `phase6-complete-v2`). |
| UI-D26.2 | Complete | Hub bubbles + Game Hub top tiles prefer live indexer `score` with local boost fallback. |
| UI-D26.3 | Complete | Nine discovery categories + `GET /api/discovery/categories`; Settings panel tabs. |
| UI-D26.4 | Complete | Reputation-weighted boosts, conduct/squad/profile signals, boost anomaly penalty. |

## Chat Border Art (off-chain slices)

Incremental off-chain Border Art work (distinct from Test-Launch Polish slices above).

| Slice | Status | Result |
| --- | --- | --- |
| BA-1 | Complete | Server catalog + CDN border art upload (`chat-overlay-rewards.*`). |
| BA-2 | Complete | Off-chain member equip projection (`member-cosmetic-equips.*`). |
| BA-3 | Complete | Live equip sync + grant picker UI. |
| BA-4 | Complete | App-wide equip polling + cross-tab broadcast. |
| BA-5 | Complete | Equip sync error toasts. |
| BA-6 | Complete | Optimistic equip retry queue. |
| BA-7 | Complete | Animated 9-slice border rendering. |
| BA-8 | Complete | Testnet catalog bootstrap + hydrate guards (`34ca625`). |
| BA-9 | Complete | Equip validation — client unlock gate, Black signal block, server catalog checks. |
| BA-10 | Complete | App-wide catalog sync — polling, cross-tab, focus refresh (`useChatOverlayCatalogAppSync`). |
| BA-11 | Complete | Owner catalog save retry queue + error toasts (mirror equip sync). |
| BA-12 | Complete | Equip picker border previews + equips store as single source of truth. |
| BA-13 | Complete | Official grant picker uses member directory roster (fixture fallback preserved). |
| BA-14.1 | Complete | Walrus quilt publisher + projection `*ArtRef` + `resolveBorderArtUrl()` (Render fallback when Walrus unset). |
| BA-14.2 | Complete | Migration script, `NAMI_WALRUS_BORDER_ART_REQUIRED`, Launch Ops Walrus card, hackathon demo console. |
| BA-14.3 | Complete | 384×384 upload enforcement + testnet `contentHash` warn. |
| BA-14.4 | Code complete (deferred) | Move + PTB wired; `NAMI_CATALOG_ATTEST_ENABLED=false` for frozen hackathon package. |

## Phase 8 — Launch Ops (UI-C27)

| Slice | Status | Result |
| --- | --- | --- |
| UI-C27.1 | Complete | `GET /api/ops/launch-summary` — test launch policy, officials queue, discovery cycle, projection counts. |
| UI-C27.2 | Complete | `LaunchOpsPanel` in Settings → Advanced → Launch Ops (official owner). |
| UI-C27.3 | Complete | `IndexedDataPanel` Discovery tab wired to `ProtocolDiscoveryPanel`. |
| UI-C27.4 | Complete | `verify-testnet-ready.mjs` probes `/api/discovery/*` and `/api/ops/launch-summary`. |
| UI-C27.5 | Complete | Launch summary + panel expose payment readiness (treasury, Stripe, PayPal); placeholder treasury no longer enables crypto checkout. |

Key files: `launch-ops.service.ts`, `launch-ops-api.ts`, `LaunchOpsPanel.tsx`, `NamiOwnerAdvancedPanel.tsx`, `IndexedDataPanel.tsx`.

Verification: `npm --prefix frontend run typecheck && npm --prefix frontend test` — **297** unit tests passing; `node scripts/verify-testnet-ready.mjs` — all checks green.

## Phase 9.1 — Walrus Sites (in progress)

| Slice | Status | Result |
| --- | --- | --- |
| 9.1.1 | Complete | `frontend/ws-resources.json` SPA routes + asset cache headers |
| 9.1.2 | Complete | `scripts/prepare-walrus-sites-dist.mjs` + `scripts/deploy-walrus-sites.mjs` |
| 9.1.3 | Complete | Launch Ops `walrus_sites` card + `walrus-sites.service.ts` projection |
| 9.1.4 | Ops | First testnet `site-builder deploy` + portal URL + zkLogin redirect update |

**Recommended next lane:**

1. Run `node scripts/deploy-walrus-sites.mjs --dry-run` then deploy when site-builder is installed.
2. Set Render payment secrets (treasury, Stripe, PayPal) — verify script warns until green.
3. Phase 9.2 Seal privacy proofs after Walrus Sites cutover or parallel ops.


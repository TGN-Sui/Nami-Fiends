# Nami Roadmap

## Purpose

Nami is a Sui-powered gaming identity, reputation, access, moderation, customization, and social protocol.

The goal is to build a portable gamer identity and trust layer for players, channels, squads, guilds, developers, creators, and future game-connected communities.

Nami should feel like a world gamers enter, not a form they fill out.

---

## Current Status

Current package:

```text
contracts/nami
```

Current protocol status:

```text
Build passing
82 tests passing
0 warnings
```

Current MVP progress:

```text
[████████████████░░░░] ~80%  (on-chain + hardening complete)
```

---

# Current Move Modules

Implemented modules:

```text
admin.move
appeals.move
badge.move
badge_issuer.move
boost.move
channel.move
channel_access.move
conduct.move
cosmetics.move
errors.move
guild.move
identity.move
jury.move
membership.move
moderation.move
passport.move
profile.move
recovery.move
squad.move
title.move
verification.move
```

Current test file:

```text
tests/nami_tests.move
```

---

# Completed Protocol Systems

Current implemented systems:

```text
Identity
Passport
Verification
Membership
Reputation
Badges
Badge Issuers
Boosts
Channels
Channel Access
Conduct
Moderation
Admin Authority
Appeals
Jury
Squads
Guilds
Profiles
Titles
Cosmetics
Recovery
Errors
```

---

# Current MVP Capabilities

Nami currently supports:

* Identity creation
* Passport creation
* NPC default tier
* Verification from NPC to Adventurer
* Pro and Elite upgrades through AdminCap
* Curved progression and reputation
* Badge minting
* Badge issuer authority
* Boost usage
* Channel creation, update, and verification
* Channel access policies tied to real Channel ownership
* NPC chat toggle
* Conduct Signals
* Black Passport restrictions
* Moderation records
* Mutes and channel bans blocking chat
* Appeals
* Advisory jury review
* Squads
* Guilds
* Public Profiles
* Earned Titles
* Cosmetic unlocks and loadouts
* Recovery requests and admin resolution

---

# Current Authority Model

AdminCap currently controls sensitive MVP actions:

```text
Badge issuer approval
Pro / Elite upgrades
Moderation actions
Appeal resolution
Jury case open / close
Cosmetic unlock grants
Recovery resolution
Channel verification
```

AdminCap is the MVP safety model.

It is not the final decentralization model.

---

# Current Effective Access Model

Nami does not rely only on raw Passport tier.

Effective access may include:

```text
Passport tier
+ Conduct status
+ Channel policy
+ Moderation records
```

Black Passport forces active benefits into NPC-equivalent restrictions while active.

This currently affects:

```text
Boosts
Channel chat
Squads
Guilds
Jury eligibility
Profile updates
Title claiming/equipping
Cosmetic equipping
```

---

# Current Documentation Status

Core documentation is synced with the latest protocol modules.

Recently synced:

```text
customization.md
recovery.md
events.md
onchain.md
access-control.md
architecture.md
systems.md
```

Recently synced (Phase 8):

```text
docs/README.md              Documentation index
docs/game-onboarding.md     Game studio wizard + pre-approval
docs/officials-submissions.md Officials review queues
docs/Trust-Score_rules.md   Live Trust Score (code-synced)
docs/Studio-portal-UI-flow.md Shipped studio UI
docs/onboarding.md          Enter Nami dual paths
docs/admin.md               Submissions tab
docs/ui-build-checkpoint.md Phase 8 slice log
frontend/README.md          Frontend module map
```

Documentation mini-sync (Phase 0): **Complete** (2026-06-22)

```text
moderation.md       — indexer routes + 80-test status synced
conduct-system.md   — timeline + SDK surfaces synced
questionnaire.md    — live wizard vs design bank cross-linked
docs/README.md      — conduct-system index entry added
```

---

# MVP Definition

A presentable MVP requires more than passing contracts.

Minimum presentable MVP:

```text
Move protocol foundation
Passing test suite
Documentation aligned with code
Testnet deployment path
Backend event indexer
Basic frontend Passport/Profile UI
Basic Channel UI
Basic moderation/admin dashboard
Basic appeal/jury dashboard
Basic recovery request view
Basic SDK read helpers
zkLogin or wallet onboarding flow
Scenario/adversarial test suite
```

---

# Current MVP Progress

```text
Nami Presentable MVP Progress

[████████████████░░░░] ~80%  (on-chain + hardening complete)
```

Current breakdown:

```text
On-chain protocol foundation + hardening:   100% done (Phase 1 + Phase 1.8 complete)
Documentation architecture:                 100% done (Phase 0 mini-sync complete)
Backend/indexer:                            100% done (Phase 2 complete — indexer + projections + HTTP + ops hardening)
Frontend/profile UI:                        100% done (Phase 3 complete — live-only surfaces audit shipped)
SDK integration:                            100% done (Phase 4 complete — reads + indexer client + subscribe helpers + CI gate)
zkLogin production flow:                    100% done (Phase 5 + 8.3 complete — env validation, demo wallet gated, recovery polish)
```

---

# Phase 0 — Documentation Foundation

Status:

```text
Complete
```

Goal:

Keep docs aligned with source code.

Last sync:

```text
2026-06-22 — moderation, conduct-system, questionnaire, docs index
```

---

# Phase 1 — Core Move Protocol

Status:

```text
Complete (2026-06-22)
```

Implemented:

```text
Identity
Passport
Verification
Membership
Reputation
Badges
Badge Issuers
Boosts
Channels
Channel Access
Conduct
Moderation
Admin
Appeals
Jury
Squads
Guilds
Profiles
Titles
Cosmetics
Recovery
Errors
```

Phase 1 exit items (shipped):

```text
Membership expiration — tier_expires_at_ms on Passport; effective tier falls back to Adventurer; MembershipExpired event
Admin role separation — ModerationCap + MembershipCap delegation from AdminCap
Deployment scripts — publish-package.sh, extract-deployment.mjs, phase1-protocol-check.sh
```

Protocol tests: **82 passing**, 0 warnings.

---

# Phase 1.8 — Protocol Hardening

Status:

```text
Complete
```

Goal:

Try to break the system before moving heavily into frontend/backend.

Completed scenario / adversarial coverage (80 tests passing):

```text
Unauthorized owner attempts
Wrong Passport / Conduct pairing
Black Passport bypass attempts (across guilds, titles, cosmetics, squads, channels, profiles, boosts, etc.)
Recovery abuse paths (unlinked pairs, zero owner, double resolution)
Appeal / Jury abuse (resolved appeal jury case, double resolution)
Guild / Squad authority abuse (owner + member add pairing)
Title / Cosmetic ownership + equip abuse (mismatched display/unlock)
Profile update abuse
Moderation / Appeal ownership abuse
```

This phase is intentionally hostile-flow focused and is now validated.

---

# Phase 2 — Backend Event Indexer

Status:

```text
Complete (2026-06-22) — pinned testnet package; republish deferred to Phase 8
```

Goal:

Index Sui events and build app-ready views.

Shipped backend services (`backend/src/projection-registry.ts`):

```text
NamiEventIndexer (poll + cursor + JSONL log)
PassportTimelineService
ProfileService
ChannelService
ChannelAccessService
ModerationService
AppealService
JuryService
SquadService
GuildService
RecoveryService
BadgeHistoryService
BoostHistoryService
Discovery rankings (/api/discovery/channels, /api/discovery/guilds)
Read-only HTTP server (server.ts) + receiving-server routes (payments, media, officials)
Replay CLI (npm --prefix backend run replay)
IndexerRuntime poll state + GET /health, GET /ready, GET /stats
Optional NAMI_ALERT_WEBHOOK_URL on consecutive poll failures
backend/README.md route catalog + testnet runbook (backups, replay verification)
scripts/verify-indexer.mjs + scripts/phase2-indexer-check.sh
```

---

# Phase 3 — Frontend MVP

Status:

```text
Complete (2026-06-22) — live-only surfaces audit; pinned testnet package
```

Phase 3 exit (live-surface audit):

```text
fixture-catalog-access.ts — gated seed-data reads (empty on test launch)
App.tsx / channel-owner-access — no direct seed-data fallback or vortex default on test launch
channel-directory-provider — live discovery no longer enriches from fixture catalog when fixtures off
listHubGlobalChats() — official global room only during test launch
LandingHeroVisual — shell passport silhouettes instead of fixture hero members
channel-game-reviews-store — no default review seed on test launch
scripts/phase3-live-audit.mjs + live-surface-audit.test.ts
```

Recent Phase 3 UI checkpoints:

```text
Appearance panel (uniform selection cards)
Ignite Radio dock + theme shell (Classic / Glass)
Owner security console (sole-owner capability guards)
Membership plan manager (upgrade / downgrade / cancel animations)
Embedded feed preferences + Game Hub layout polish
```

Minimum frontend screens:

```text
Sign in
Create Identity
Create Passport
View Profile
View Passport
View badges
View titles
View cosmetics
View Conduct Signal
View membership tier
Channel page
Channel access settings
Squad page
Guild page
Moderation/admin dashboard
Appeal/jury dashboard
Recovery request page
```

---

# Phase 4 — SDK Layer

Status:

```text
Complete (2026-06-22) — pinned testnet package; republish deferred to Phase 8
```

Shipped SDK helpers (`SDK/src/`):

```text
createNamiClient + object parsers (identity, passport, profile, conduct, channel, squad, guild, titles, cosmetics)
loadIdentityProtocolView, loadPassportProtocolView, loadProfileProtocolView, loadMembershipProtocolView
loadConductProtocolView, loadCustomizationProtocolView, loadSquadsProtocolView, loadGuildCardsForMember
loadChannelCardsForOwner, loadOwnerChannelAccessPolicies, checkChannelAccessRead
createNamiIndexerClient (appeals, jury, moderation, recovery, discovery, timelines, badge/boost history)
getHealth / getReady / getStats on indexer client
fetchNamiModuleEvents, subscribeToNamiEvents (on-chain modules)
indexer-subscriptions.ts — subscribeToIndexerProjection + dedicated projection poll helpers
SDK/README.md + scripts/phase4-sdk-check.sh + scripts/verify-sdk-indexer.mjs
indexer-integration.test.ts (runs when NAMI_INDEXER_URL is set)
mvp-check.sh SDK build + unit test gate
enterNamiMoveTarget transaction helper
```

---

# Phase 5 — zkLogin / Wallet Onboarding

Status:

```text
Complete (2026-06-22) — pinned testnet package; OAuth registration is per deploy origin (human step)
```

Shipped:

```text
zkLogin session helpers (frontend/src/zklogin.ts) + session expiry cleanup
zklogin-config.ts env validation + readZkLoginEnvConfig / validateZkLoginEnv
Enter Nami Google path (EntryLoginPanel, EntryPage)
Game studio onboarding requires zkLogin link before ticket submit
wallet-source.ts — demo wallet never used for trust score on test launch
Demo claim / demo owner / demo trust paths gated when VITE_NAMI_TEST_LAUNCH=true
onboarding-recovery.ts — recovery email hints on signup + login
docs/testnet-zklogin.md expanded (multi-origin, salt, session lifecycle)
scripts/verify-zklogin-config.mjs + scripts/phase5-zklogin-check.sh
sync-testnet-env.mjs normalizes zklogin redirect trailing slash
```

Human step at go-live: register each public origin in Google OAuth console (see docs/testnet-zklogin.md).

---

# Phase 6 — Discovery Layer

Status:

```text
Complete (2026-06-22) — phase6-complete-v2 engine + categories shipped
```

Shipped:

```text
backend/src/discovery-scoring.ts — multi-signal channel + guild scoring
backend/src/discovery-categories.ts — featured, top_boosted, rising, verified, new_player_friendly, guild_spotlight, badge_campaigns, cozy, competitive
Reputation-weighted boost power (booster passport reputation + membership tier)
Conduct health scoring (Green/Orange/Red; Black excluded)
Squad sponsorship + public profile activity signals
Boost anomaly penalty when one booster dominates >60% weighted power
Per-owner per-channel boost concentration cap (3 boosts / cycle)
GET /api/discovery/channels?category=&weekId= + /guilds + /categories
score_components transparency (boost, verification, badges, guild, moderation, reputation, squad, profile, anomaly)
Nami Hub + Game Hub ordering prefers live discovery scores when indexer is connected
ProtocolDiscoveryPanel category tabs + score breakdown
```

Deferred to post-MVP:

```text
Event discovery boosts (needs backend event projection sync)
Developer verification beyond channel.is_verified flag
Personalized per-member discovery recommendations
Full anomaly detection + human review queue
```

Discovery should be mostly off-chain and anchored by on-chain signals.

---

# Phase 7 — Product UX & UI Evolution

Status:

```text
Complete — UI-B21 surfaces shipped; test-launch polish slices 1–10 landed (commit 347511f)
```

Checkpoint: `docs/ui-build-checkpoint.md` (UI-A20.5 + UI-B21 + test-launch polish complete).

Phase 7 delivered:

```text
UI-B21 product surfaces (Hub, Game Hub, profiles, chat, membership, media, guild spaces)
Backend receiving server wiring (payments, preferences, media, fulfillment)
Unified frontend architecture for test launch (config, providers, stores)
Operator vs user surface separation (IndexedDataPanel gated to official owner)
Fixture/live directory policy for Hub and Game Hub discovery
```

Phase 7 intake (UI-B21 — complete):

```text
UI-B21.1 Account sign-in moved to Settings (web2 copy, no sidebar connect)
UI-B21.2 Theme modes: Nami Default, Dark, Light, Custom color wheel
UI-B21.3 Nami Hub global chats panel + official default room + Elite temporary rooms
UI-B21.4 Game Hub genre chat browser (community bubbles) + bottom chat dock
UI-B21.5 Embedded social panels (X, Twitch/live) on member/dev/guild/game profiles
UI-B21.6 My Profile passport ↔ Badge Collectors Book swipe carousel
UI-B21.7 TCG-style member passport card when viewing other members
UI-B21.8 Membership checkout + backend payment intents (Stripe, PayPal, crypto, mock)
UI-B21.9 Pinned top-right profile avatar (rainbow foil, uploaded photo, tier signal)
UI-B21.10 Live-streaming dot on avatars (grid overlay, top-right inset on all surfaces)
UI-B21.11 TCG passport vertical layout polish (tier header, centered photo, stats-row level)
UI-B21.12 Chat emojis, @member tags, tag notifications, social embed player
```

Phase 8 intake (UI-B22 — game channel profile — complete):

```text
UI-B22.1 Tabbed game channel profile (News, Events, Reviews, About, Chat, Owner)
UI-B22.2 Unified profile shell; main chat on profile page instead of separate chat route
UI-B22.3 News detail overlay; related channel cover tiles
UI-B22.4 Channel events on profile; owner publish entry to channel events screen
UI-B22.5 Badge-gated community reviews (verified + channel badge, one review per member)
UI-B22.6 Focused banner alerts (owner editor, preview, subscriber popup, reminder bar)
UI-B22.7 Channel profile brand theme + shared chrome hook
UI-B22.8 Reviews/badge store snapshot caching (blank-page guard)
UI-B22.9 Game channel chat emoji scale parity (28px picker + inline)
```

Phase 7 wiring (server-backed — complete):

```text
UI-B21.13 Payment webhooks activate backend membership subscriptions
UI-B21.14 Member preferences API (avatar URL + streaming online)
UI-B21.15 Media upload API for profile avatars
UI-B21.16 MemberSessionSync hydrates wallet session from backend
UI-B21.17 On-chain fulfillment queue for paid Pro/Elite + owner AdminCap panel
UI-B21.18 Wallet-signed auth for preference and media writes
UI-B21.19 Channel cover media upload + preferences API
UI-B21.20 Studio logo media upload + preferences API
UI-B21.21 Subscriber on-chain fulfillment card in membership panel
UI-B21.22 Cross-user AdminCap fulfillment for queued subscriber passports
```

Test-launch polish (slices 1–10 — complete):

```text
Slice 1  app-config, protocol-availability, preference/safety stores, ProtocolStatusBar
Slice 2  Remove dead demo UI (UxPreviewConsole, MediaUploadPrepCard, demo tag seed mount)
Slice 3  Split domain/types from fixtures/seed-data; uiMockData compatibility facade
Slice 4  preferences-sync + media-upload-service unified paths
Slice 5  affiliation-provider for guild/squad surfaces
Slice 6  Gate local store auto-seeding when VITE_NAMI_TEST_LAUNCH=true
Slice 7  channel-directory-provider + member-directory-provider (Hub / Game Hub)
Slice 8  Gate local-mock checkout and X verification mock behind dev/test policy
Slice 9  Gate IndexedDataPanel to official owner; user-facing protocol copy cleanup
Slice 10 Documentation sync and Phase 7 completion (this checkpoint)
```

Fixture and discovery policy (locked for test launch):

```text
VITE_NAMI_DEV_FIXTURES=true (default) keeps fixture catalogs for polish and offline dev
Indexer URL alone does not disable fixtures — live discovery replaces fixtures when ranked rows return
Empty or loading discovery cycles still show fixtures while dev fixtures are enabled
VITE_NAMI_DEV_FIXTURES=false forces strict empty states on directory surfaces
VITE_NAMI_TEST_LAUNCH=true disables auto-seed, local-mock checkout, and mock provider buttons
```

Product rules (unchanged):

```text
Paid features add capability or customization only — never verification or trust
Owner vs member preview modes stay explicit
Provider interfaces (affiliation, channel directory, member directory) are the partnership extension points
```

---

# Phase 7.1 — $GOON Economy & Gifting (Planned)

Status:

```text
Planned — live-stream and user gifting next; Buy Goon + profile tips shipped
```

Shipped (UI slice):

```text
Wallet connect lives in Settings only — landing and onboarding avoid "wallet" copy
Buy Goon on member profiles when a Sui wallet is connected (GoonQuickBuy swap flow)
Tip $GOON to members from connected wallet (treasury-routed, local activity ledger)
```

---

# Phase 7.2 — Game Channel Owner UX (Shipped)

Status:

```text
Shipped — grouped owner settings, media persistence, boost visibility, discovery fixes
```

Shipped:

```text
Tabbed owner settings: Brand & media | Promotions | Alerts & emojis | Advanced
Unified draft + Save settings / Discard footer (channel-owner-settings-draft.ts)
Focused banner alerts for all game owners (Elite gate removed)
IndexedDB channel media persistence (cover, hero, trailer) with startup bootstrap
Hub partner banner layered cover + scrim CSS
Subscribed + owner-provisioned channels in hub/profile discovery
Boost cycle summary for game owners in Settings + pinned profile card
Settings Account tab render fix (player-platform-sync-store snapshot cache)
Upload local fallback when wallet auth fails (media-upload-service.ts)
Pro squad slots aligned to 2 on-chain (squad.move) and in membership plans
```

Verification:

```text
npm --prefix frontend test — 296 passing
sui move test — 80 passing
```

Planned — Gifting:

```text
Send gifts to live streams and to member profiles
Gifts must be purchased with $GOON or typical payment options (Stripe, PayPal, card)
Gift catalog with tiered animations surfaced on stream embeds and profile showcases
Gift revenue split: creator / channel owner / platform treasury (policy TBD)
Backend fulfillment + on-chain $GOON settlement where wallet is connected
```

Depends on:

```text
Phase 8 receiving server payment webhooks (fiat → $GOON credit or direct gift purchase)
Treasury + $GOON coin type configured on testnet/mainnet
Embedded social / live embed player hooks for real-time gift overlays
```

---

# Phase 8 — Public Launch Preparation

Status:

```text
In progress — Phase 8 overall ~92% complete
```

```text
Phase 8 progress

[██████████████████░░] ~92%

8.1 Testnet launch mode      ██████████████████░░  ~92%
8.2 Deploy + public URL      ████████░░░░░░░░░░░░  ~40%
8.3 zkLogin production       ████████████████████  100%
8.4 Security + custody       ████████████░░░░░░░░  ~60%
```

Launch requirements:

```text
Testnet deployment
Deployment docs
Security review
AdminCap custody plan
Backend indexer live
Frontend MVP live
Basic analytics
Moderation dashboard
Privacy review
Community guideline drafts
Support/recovery process
Scenario test results
```

Official testnet policy (no demo surfaces):

```text
VITE_NAMI_TEST_LAUNCH=true on all testnet builds
VITE_NAMI_DEV_FIXTURES=false — no fixture catalogs on directory or chat surfaces
Remove or gate demo wallet, demo claim method, mock checkout, mock provider buttons, and local auto-seed
Nodename claims use @fiend prefix (see docs/sui-layer.md)
Live indexer + receiving server required; empty states preferred over simulated data
```

---

## Phase 8.1 — Testnet Launch Mode (In progress)

Status:

```text
~92% — policy + officials API + env tooling + genesis passport + FIEND owner identity + launch ops dashboard shipped; deploy secrets + public URL pending
```

Shipped:

```text
Genesis passport for test-launch users (lvl 1, 0 XP, NPC, onboarding badge only; demo chat purge)
FIEND owner display label + galaxy passport + rainbow borders (official owner wallet only)
Complimentary Elite for official owner, moderators, and Nami team (no payment)
VITE_NAMI_TEST_LAUNCH=true forces fixture catalogs off (even if DEV_FIXTURES=true)
isDemoSimulationEnabled() gates dashboard perspectives, event sim buttons, approval sims, demo claim method
shouldUseDemoOwnerFallback() removes demo wallet owner on test launch
Shell catalog placeholders (self member + routing shells) when fixtures are disabled
frontend/.env.testnet.example + backend/.env.testnet.example (pinned to latest.json IDs)
Guild/squad seed catalogs gated behind shouldUseDevFixtures()
Channel banner simulation disabled without fixtures
@fiend nodename prefix for passport claims
Receiving server officials queue: GET/POST /api/officials/submissions (+ sync)
Test launch hydrates + dual-writes suggestions, game tickets, partner banners, nodename claims
Officials sync auth on test launch: wallet signature; official owner full merge; member-scoped merge
Optional NAMI_OFFICIALS_SYNC_SECRET for server-side ops (never in frontend env)
NAMI_TEST_LAUNCH on backend disables mock payment providers
docs/testnet-launch-checklist.md + docs/testnet-zklogin.md
scripts/sync-testnet-env.mjs, verify-testnet-ready.mjs, extract-testnet-latest.mjs
GET /api/ops/launch-summary — test launch flags, officials queue depth, discovery cycle, projection counts
Launch Ops panel (Settings → Advanced → Launch Ops) + Discovery tab on Indexed Data panel
verify-testnet-ready.mjs probes discovery + launch-summary endpoints
Move package verified: 80 tests passing (no republish required 2026-06-19)
```

Remaining before testnet go-live:

```text
Set official owner, treasury, Stripe/PayPal, and zkLogin client ID (human secrets)
Deploy receiving server to a public URL + set VITE_NAMI_INDEXER_URL
node scripts/verify-testnet-ready.mjs — all checks green
npm --prefix frontend run build against .env.local
AdminCap custody plan finalized + privacy/community guideline drafts
```

---

## Phase 8.2 — Public Deploy URL (In progress)

Status:

```text
~40% — Render + Vercel blueprints shipped; verify-public-deploy.mjs probes public URLs; human deploy pending
```

Deliverables:

```text
Public VITE_NAMI_INDEXER_URL
Public frontend origin with zkLogin redirect registered
Health + officials API reachable from browser CORS
scripts/verify-public-deploy.mjs + scripts/phase8-deploy-check.sh
```

---

## Phase 8.3 — zkLogin Production (Complete)

Status:

```text
Complete (2026-06-22) — code + docs + verify scripts shipped; register OAuth per origin at deploy
```

See [testnet-zklogin.md](./testnet-zklogin.md). Run `node scripts/verify-zklogin-config.mjs` before each public origin build.

---

## Phase 8.4 — Security & Custody (In progress)

Status:

```text
~60% — custody runbook + privacy/community drafts shipped; human backup holder + legal review pending
```

Shipped:

```text
Officials POST /sync wallet auth on NAMI_TEST_LAUNCH=true
Official owner full merge; member-scoped merge for tickets, claims, suggestions
Optional NAMI_OFFICIALS_SYNC_SECRET for ops-only server sync
NAMI_PAYMENT_ALLOW_MOCK=false enforced when NAMI_TEST_LAUNCH=true
docs/admincap-custody.md — primary/backup holder runbook
docs/privacy-guidelines-draft.md + docs/community-guidelines-draft.md
```

Remaining:

```text
Assign named backup holder (human step)
Legal review of privacy draft before mainnet
Full security review before public URL
```

---

# Phase 9 — Sui Stack Integrations (Planned)

Status:

```text
Not started — documented for future exploration; no implementation yet
```

Goal:

Extend Nami onto Sui-native hosting, privacy, and agent memory primitives without blocking Phase 8 launch.

Out of Phase 9 scope (deferred):

```text
Standalone mobile genre chat experiment — see Phase 10; starts only after this Nami project is complete
```

Prerequisite:

```text
Phase 8 launch ops stable
Backend receiving server live (hybrid architecture)
zkLogin redirect URIs registered for production portal domains
```

---

## Phase 9.1 — Walrus Sites Frontend Hosting

Status:

```text
Planned
```

Scope:

```text
Deploy frontend/dist via site-builder (Walrus Sites + Sui site object)
Add ws-resources.json SPA fallback and sites-config.yaml
Optional SuiNS name on the site object
Build-time env for VITE_NAMI_INDEXER_URL, package ID, zkLogin client/redirect
Epoch renewal ops for Walrus blob storage
```

Out of scope:

```text
Hosting the receiving server, webhooks, or writable media APIs on Walrus Sites
Replacing backend persistence for officials queues (still needs server or on-chain flow)
```

Architecture:

```text
Walrus Sites → static React SPA
Receiving server → payments, preferences, uploads, projections (separate host)
Sui RPC + Move package → wallet, zkLogin, on-chain reads/writes from browser
```

Reference:

```text
docs/sui-layer.md (Walrus media references — later phase)
Walrus Sites docs: site-builder deploy, ws-resources.json routes, wal.app portal
```

---

## Phase 9.2 — Privacy Proofs Layer (Seal, ZK, Sui Spheres)

Status:

```text
Planned — evaluate as Sui privacy primitives mature
```

Goal:

Verify eligibility and store sensitive evidence without exposing unnecessary data publicly.

Nami-aligned use cases:

```text
Private appeal evidence (officials + jury access only)
Private moderation evidence packets
Linked-account verification proofs without public PII
Recovery-sensitive attachments
Encrypted guild or channel owner records
Prove verification / conduct eligibility without revealing underlying credentials
```

Stack (today):

```text
Seal — programmable encryption and role-based decryption (available; messaging SDK and MemWal already use it)
Sui Groth16 zk proofs — prove facts on-chain without revealing underlying data
Nautilus — verifiable offchain computation with on-chain attestations (oracle / compliance patterns)
```

Sui Spheres:

```text
Emerging Sui privacy umbrella (selective disclosure, contextual visibility, composable privacy workflows)
Treat as roadmap signal — design Nami proof flows against Seal + zk proofs now; adopt Spheres patterns when APIs stabilize
```

Privacy principle (unchanged):

```text
On-chain anchors trust; off-chain or encrypted stores hold sensitive payloads
Officials and jury surfaces decrypt only within policy — never public-by-default
```

Depends on:

```text
Phase 2 indexer for proof verification views
Appeals / moderation backend persistence (localStorage is insufficient for encrypted evidence)
```

---

## Phase 9.3 — MemWal (Walrus Memory)

Status:

```text
Planned — scoped experimentation only
```

What MemWal is:

```text
Portable, Seal-encrypted, Walrus-backed memory for AI agents (beta)
Relayer handles embed, encrypt, upload, recall — not a human chat log store
```

Realistic Nami uses:

```text
Nami Officials assistant context across review sessions
Moderation triage memory (policy-grounded, namespace-scoped)
Genre lounge or support copilot memory for a signed-in member
Cross-session agent workflows (onboarding help, recovery guidance)
```

Not a substitute for:

```text
Genre chat message history (use Messaging SDK or off-chain chat store)
Passport / badge / reputation state (stay on-chain)
Public lounge transcripts at scale
```

Depends on:

```text
MemWal relayer availability and namespace policy design
Clear separation: agent memory vs user messaging vs on-chain proofs
```

---

# Phase 10 — Post-MVP Experiments (Deferred)

Status:

```text
Deferred — do not start until the Nami project is complete (Phase 8 exit criteria met)
```

Gate:

```text
Presentable MVP shipped and stable on testnet/mainnet path
Phases 2–5 delivery complete (indexer, frontend wiring, SDK, zkLogin production flow)
No open launch blockers from Phase 8 checklist
```

---

## Phase 10.1 — Messaging SDK + Standalone Mobile Genre Chat

Status:

```text
Deferred — exploratory; not part of core Nami delivery
```

Goal:

Prototype a wallet-linked, E2E-encrypted mobile chat focused on Nami's 23 official IGDB genre lounges.

Current UI anchor (web — already shipped):

```text
frontend/src/global-chats.ts — genreOfficialChats (23 rooms from LANDING_GENRE_LOUNGES)
Game Hub genre bubble browser + pinned dock (Phase 7 / UI-B21.4)
Today: localStorage-backed messages-store; no realtime transport
```

Messaging SDK fit:

```text
Wallet-linked identity (aligns with Nami passport / zkLogin)
Group channels with programmable membership (map to verification + conduct gates)
Seal E2E encryption + Walrus attachments
Recoverable conversations across devices
Reference app: chatty.wal.app
```

Constraints (read before building):

```text
SDK is alpha; active development in sui-stack-messaging repo (successor to sui-stack-messaging-sdk)
Testnet only today — not production-ready for public launch
Messages default to on-chain Sui objects — high-volume public genre lounges need careful architecture
Nami docs already position primary chat as off-chain; SDK is better for DMs, small groups, officials channels, and emergency fallback
No unauthenticated messaging — all participants need verifiable Sui identity
```

Proposed experiment scope:

```text
Standalone mobile shell (React Native or PWA) — genre lounge picker + single-room chat
One genre channel on testnet end-to-end (e.g. Shooter or MOBA)
Map Nami canSendChatMessages / verification rules to SDK channel membership policy
Does not replace or block the shipped web app
```

Stretch (post-experiment):

```text
Officials announcement channels via SDK fallback (see docs/resilience.md)
Cross-device sync for DMs and squad threads
Integrate genre broadcasts and @member tags once message schema is stable
```

Depends on:

```text
Nami project complete (Phase 10 gate above)
Phase 5 zkLogin / wallet onboarding production flow
Genre room registry contract or config shared between web and mobile
Phase 9.1 optional — mobile can target testnet without Walrus Sites
```

---

# Long-Term Vision

Nami becomes a portable identity and trust layer for gaming.

A player should be able to carry their:

```text
Identity
Passport
Profile
Reputation
Badges
Titles
Cosmetics
Conduct Signal
Membership access
Squads
Guilds
Channel history
Appeals history
Recovery history
Prestige
Developer relationships
Discovery influence
```

across connected games, communities, and experiences.


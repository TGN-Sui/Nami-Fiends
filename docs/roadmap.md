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
80 tests passing
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

Remaining mini-sync targets:

```text
moderation.md
conduct-system.md
questionnaire.md (long-form bank vs live wizard — cross-linked)
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
Documentation architecture:                 Mini-sync in progress
Backend/indexer:                            0% done (Phase 2)
Frontend/profile UI:                        Phase 7 + Phase 8 onboarding shipped; protocol wiring pending (Phase 3)
SDK integration:                            Thin client exists; rich helpers pending (Phase 4)
zkLogin production flow:                    0% done (Phase 5)
```

---

# Phase 0 — Documentation Foundation

Status:

```text
Mostly complete
```

Goal:

Keep docs aligned with source code.

Current focus:

```text
Mini-sync docs after title, cosmetics, recovery, channel, and profile modules
```

---

# Phase 1 — Core Move Protocol

Status:

```text
Complete
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

Remaining possible Phase 1 items:

```text
Membership expiration
Admin role separation
Deployment scripts
```

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
Not started
```

Goal:

Index Sui events and build app-ready views.

Initial backend services:

```text
Event indexer
Profile service
Passport timeline
Badge history
Boost history
Channel service
Moderation service
Appeal service
Jury service
Squad service
Guild service
Recovery service
```

---

# Phase 3 — Frontend MVP

Status:

```text
UI-B21 + test-launch polish complete; core surfaces wired to receiving server with fixture fallback
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
Not started
```

Initial SDK helpers:

```text
Read Identity
Read Passport
Read Profile
Read Membership
Read Reputation
Read Badges
Read Conduct
Read Channel
Check Channel Access
Read Squads
Read Guilds
Read Titles
Read Cosmetics
Subscribe to events
```

---

# Phase 5 — zkLogin / Wallet Onboarding

Status:

```text
Not started
```

Goal:

Create a gamer-friendly login and onboarding flow.

Potential paths:

```text
Wallet connect
zkLogin
Social login references
Future linked accounts
Recovery-aware onboarding
```

---

# Phase 6 — Discovery Layer

Status:

```text
Planned
```

Discovery may use:

```text
Boosts
Reputation
Badge quality
Conduct health
Moderation health
Channel verification
Guild activity
Squad activity
Profile activity
Developer verification
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

# Phase 8 — Public Launch Preparation

Status:

```text
Unblocked — Phase 7 complete; begin launch ops when ready
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


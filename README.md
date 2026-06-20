# Nami Chat

Nami Chat is a Sui-powered gaming identity, reputation, access, moderation, customization, and social protocol.

Nami is designed for gamers, developers, channels, squads, guilds, creators, and future game-connected communities.

The goal is not only to build a chat app.

The goal is to build a portable gamer identity and trust layer.

---

## Current Status

```text
Move build: passing
Move tests: 80 passing
Frontend tests: 133 passing (vitest)
Warnings: 0
Documentation: synced (Phase 8 entry + game onboarding + officials queue)
MVP progress: ~82% (on-chain complete; frontend onboarding surfaces shipped)
```

Current Move package:

```text
contracts/nami
```

---

## Repository Structure

```text
nami_chat/
├── backend/
├── contracts/
│   └── nami/
│       ├── sources/
│       ├── tests/
│       ├── Move.toml
│       └── Move.lock
├── docs/
├── frontend/
├── sdk/
└── README.md
```

---

## Current Move Modules

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

---

## Core Systems

Nami currently includes:

* Identity ownership
* Passport progression
* Verification from NPC to Adventurer
* Membership tiers
* Reputation
* Badges and badge issuer authority
* Boosts
* Channels and channel access policies
* Conduct Signals
* Black Passport restrictions
* Moderation records
* AdminCap authority
* Appeals
* Advisory jury review
* Squads
* Guilds
* Public Profiles
* Earned Titles
* Cosmetic unlocks and loadouts
* Recovery requests

---

## Membership Tiers

```text
NPC
Adventurer
Pro
Elite
```

New Passports start as NPC.

Verification moves a user from NPC to Adventurer.

AdminCap currently controls Pro and Elite upgrades during MVP development.

---

## Conduct Signals

```text
Green  = friendly / casual
Orange = serious / competitive / friendly
Red    = high-intensity / PvP
Black  = Passport downed
```

Black Passport means:

```text
Passport downed. Respawning in...
```

While Black Passport is active, effective access falls back to NPC-equivalent restrictions.

---

## Current Access Model

Nami does not rely only on raw membership tier.

Effective access may include:

```text
Passport tier
+ Conduct status
+ Channel policy
+ Moderation records
```

This means a Pro or Elite member can still be restricted if their Passport is Black.

---

## Channels

Channels are on-chain community or creator spaces.

Current Channel features:

* Channel creation
* Channel metadata references
* Public/private setting
* AdminCap channel verification
* Channel-aware access policy creation
* NPC chat toggle
* Minimum tier and reputation rules

---

## Profiles and Customization

Profiles are public Passport display anchors.

Current customization features:

* Profile metadata references
* Earned reputation titles
* Title display object
* Cosmetic unlock proofs
* Cosmetic loadout object
* Profile frame equip flow

Most rich media should stay off-chain.

---

## Moderation and Fairness

Current moderation actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

Appeals allow users to challenge moderation actions.

Jury review allows eligible Pro and Elite members to provide advisory recommendations.

---

## Recovery

Recovery currently supports:

```text
Identity + Passport → RecoveryRequest → Admin resolution
```

Recovery does not transfer ownership yet.

This is intentional until the recovery security model is mature.

---

## Build and Test

From the Move package:

```bash
cd contracts/nami
sui move build
sui move test
```

Expected current result:

```text
55 tests passing
0 warnings
```

---

## Documentation

Full index: **[docs/README.md](docs/README.md)**

Recent additions (Phase 8):

```text
docs/game-onboarding.md       Game studio wizard, tickets, pre-approval
docs/officials-submissions.md Suggestions, game tickets, partner banners
docs/Trust-Score_rules.md     Live game Trust Score (synced to code)
docs/Studio-portal-UI-flow.md Shipped studio UI flow
```

Core protocol docs:

```text
docs/roadmap.md
docs/architecture.md
docs/systems.md
docs/onboarding.md
docs/ui-build-checkpoint.md
docs/admin.md
docs/verification.md
docs/badge-system.md
docs/landing-page.md
```

---

## MVP Progress

```text
Nami Presentable MVP Progress

[████████████████░░░░] ~82%
```

Current breakdown:

```text
On-chain protocol foundation + hardening:   100% done (Phase 1 + Phase 1.8 complete)
Documentation architecture:                 Synced (docs/README.md index + Phase 8 flows)
Backend/indexer:                            Partial (read-only HTTP); full indexer pending (Phase 2)
Frontend/profile UI:                        Phase 7 + Phase 8 entry/game onboarding shipped
SDK integration:                            Thin client exists; rich helpers pending (Phase 4)
zkLogin production flow:                    Dev placeholder; production path pending (Phase 5)
```

---

## Next Development Targets

Recommended next phases:

```text
Backend event indexer (Phase 2)
Real frontend protocol wiring + MVP screens (Phase 3)
SDK read helpers for Guilds, Titles, Cosmetics, Recovery, Appeals, Jury, etc. (Phase 4)
zkLogin production flow (Phase 5)
Testnet deployment scripts
```

---

## Core Principle

Identity owns presence.

Passport owns journey.

Verification unlocks trusted entry.

Membership controls access.

Reputation is earned.

Badges prove meaningful activity.

Conduct communicates interaction style.

Moderation protects communities.

Appeals create fairness.

Jury adds community voice.

Squads create small trust networks.

Guilds create larger communities.

Profiles display identity.

Titles recognize earned status.

Cosmetics express style.

Recovery protects continuity.

Sui anchors proof.

Nami should feel like a world gamers enter, not a form they fill out.

## UI Build Checkpoint

The current frontend UI build checkpoint is documented in [docs/ui-build-checkpoint.md](docs/ui-build-checkpoint.md).

**Phase 7** (UI-B21 / UI-B22): Hub, Game Hub, channel profiles, membership checkout — complete.

**Phase 8** (entry + game onboarding): Enter Nami gate, dual Gamer/Game paths, Trust Score, officials submissions queue, pre-approval workspace — shipped. See [docs/game-onboarding.md](docs/game-onboarding.md).

Frontend verification: `npm --prefix frontend run typecheck && npm --prefix frontend test` (133 tests).


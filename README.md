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
Warnings: 0
Documentation: synced/in-progress mini-sync
MVP progress: ~80% (on-chain + full protocol hardening complete)
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

Core docs:

```text
docs/roadmap.md
docs/architecture.md
docs/systems.md
docs/onchain.md
docs/events.md
docs/access-control.md
docs/passport.md
docs/passport-object.md
docs/identity.md
docs/identity-object.md
docs/verification.md
docs/membership.md
docs/reputation.md
docs/badge-system.md
docs/boost-system.md
docs/conduct-system.md
docs/moderation.md
docs/admin.md
docs/appeals.md
docs/jury.md
docs/squads.md
docs/guilds.md
docs/customization.md
docs/recovery.md
docs/resilience.md
docs/sui-layer.md
docs/trust-system.md
docs/vision.md
```

---

## MVP Progress

```text
Nami Presentable MVP Progress

[██████████████░░░░░░] 71%
```

Current breakdown:

```text
On-chain protocol foundation + hardening:   100% done (Phase 1 + Phase 1.8 / Break-the-System complete)
Documentation architecture:                 Mini-sync in progress
Backend/indexer:                            0% done (Phase 2)
Frontend/profile UI:                        UI polish checkpoint complete; protocol wiring pending (Phase 3)
SDK integration:                            Thin client exists; rich helpers pending (Phase 4)
zkLogin production flow:                    0% done (Phase 5)
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

<!-- UI-A20.5-CHECKPOINT:START -->
## UI Build Checkpoint

The current frontend UI build checkpoint is documented in [docs/ui-build-checkpoint.md](docs/ui-build-checkpoint.md).

Completed through UI-A20.4:
- UI-A19 Member Spotlight + Sidebar Avatar Polish
- UI-A20.1 Ownership Mode Clarity
- UI-A20.2 Channel Palette Member Flow
- UI-A20.3 Owner Tool Action States
- UI-A20.4 Final responsive/accessibility polish

TypeScript and production frontend build passed at the UI-A20.5 checkpoint.
<!-- UI-A20.5-CHECKPOINT:END -->


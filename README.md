# Nami Chat

Nami Chat is a Sui-powered gaming identity, reputation, access, moderation, and social protocol.

Nami is designed for gamers, developers, squads, guilds, verified channels, and future game-connected communities.

The goal is not only to build a chat app.

The goal is to build a portable gamer identity and trust layer.

---

## Current Status

```text
Move build: passing
Move tests: 33 passing
Warnings: 0
Documentation: synced
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
channel_access.move
conduct.move
errors.move
identity.move
jury.move
membership.move
moderation.move
passport.move
squad.move
verification.move
```

---

## Core Systems

Nami currently includes:

* Identity ownership
* Passport progression
* Verification from NPC to Adventurer
* Membership tiers
* Curved XP and reputation
* Badge issuance
* Badge issuer authority
* Boosts
* Channel access policies
* NPC chat toggle
* Conduct Signals
* Black Passport restrictions
* Moderation records
* AdminCap authority
* Appeals
* Advisory jury review
* Squads and sponsorship

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

## Build and Test

From the Move package:

```bash
cd contracts/nami
sui move build
sui move test
```

Expected current result:

```text
33 tests passing
0 warnings
```

---

## Documentation

Main docs:

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

[████████████░░░░░░░░] 58%
```

Current breakdown:

```text
On-chain protocol foundation:   ~93% done
Documentation architecture:     100% synced
Backend/indexer:                 0% done
Frontend/profile UI:             0% done
SDK integration:                 0% done
zkLogin production flow:          0% done
```

---

## Next Development Targets

Planned next modules and systems:

```text
guild.move
customization / cosmetics
titles
recovery
backend event indexer
frontend Passport UI
SDK helpers
zkLogin production flow
```

The next recommended code module is:

```text
guild.move
```

Guilds will become larger persistent communities, while Squads remain small trust and sponsorship groups.

---

## Core Principle

Identity owns presence.

Passport owns journey.

Membership controls access.

Reputation is earned.

Conduct communicates interaction style.

Moderation protects communities.

Appeals create fairness.

Jury adds community voice.

Squads create small trust networks.

Sui anchors proof.

Nami should feel like a world gamers enter, not a form they fill out.


# Nami-Fiends
One identity. Every game.

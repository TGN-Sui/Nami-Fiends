# Nami Protocol Roadmap

## Overview

Nami is an interoperable gaming identity, reputation, discovery, and communication protocol.

Nami is being built as infrastructure for gamers, developers, guilds, squads, channels, and communities across games, websites, dApps, and future gaming ecosystems.

Nami is not only a world chat product.

Nami is the identity and trust layer that world chat, discovery, moderation, customization, guilds, and developer hubs will be built on top of.

---

# Current Status

## Completed Core Reset

The current Sui Move core has been reset, aligned, built, and tested.

Current package path:

```text
nami_chat/contracts/nami
```

Current source modules:

```text
sources/
├── badge.move
├── boost.move
├── errors.move
├── identity.move
└── passport.move
```

Current test file:

```text
tests/nami_tests.move
```

Current test status:

```text
6 tests passing
0 failed
```

---

# Current Working Systems

## Identity

Status: Implemented Core

Identity is the root ownership layer.

Current responsibilities:

* Owner tracking
* zkLogin / wallet-compatible ownership model
* Trust tier placeholder
* Verification level placeholder
* Passport reference placeholder
* Creation timestamp
* Versioning

Identity should remain minimal and stable.

---

## Passport

Status: Implemented Core

Passport is the gamer journey layer.

Current responsibilities:

* XP
* Curved level progression
* Level progress
* Badge points
* Reputation rank
* Membership/access tier
* Archetype
* Boost score placeholder
* Prestige points placeholder

Current default Passport state:

* Level 1
* 0 XP
* 0 badge points
* Newbie reputation
* NPC membership tier
* Selected onboarding archetype
* 0 prestige points

---

## Curved Progression

Status: Implemented Core

Nami no longer uses linear level progression.

XP is earned through badge points.

Current badge XP model:

* Basic Badge = 1 XP
* Event Badge = 2 XP
* Completion Badge = 3 XP

Current progression goal:

* Level 100 should require long-term dedication
* Level 100 should be achievable after roughly 3 months of high dedication
* Level cycles may reset around 6 months
* Players who reach Level 100 early can begin earning Prestige progress

Prestige titles will be defined later.

---

## Reputation

Status: Implemented Core

Current reputation ranks:

* Newbie
* Gamester
* Goblin
* Goonie
* Fiend

Reputation is earned from:

* Badge points
* XP
* Level progression
* Future contribution systems

Reputation is separate from membership.

Reputation cannot be purchased.

---

## Membership

Status: Implemented Core

Current membership/access tiers:

* NPC
* Adventurer
* Pro
* Elite

Current rules:

* NPC is the default free/unverified tier
* Adventurer is the verified human/basic access tier
* Pro is a higher access/supporter tier
* Elite is the premium supporter tier

Membership controls access.

Membership does not control reputation.

Future versions will add:

* Expiration
* Renewal
* Grace periods
* Active tier checks
* Subscription-aware access

---

## Badges

Status: Implemented Core

Badges are on-chain achievement proofs.

Current badge types:

* Basic Badge
* Event Badge
* Completion Badge

Badges currently:

* Mint badge objects
* Add badge points to Passport
* Add XP through badge points
* Influence reputation

Badge quality standards are documented.

Starting a game does not qualify as a Completion Badge.

---

## Boosts

Status: Implemented Core

Boosts are discovery signals.

Current boost access:

* NPC: no boost access
* Adventurer: 1 boost power
* Pro: 6 boost power
* Elite: 8 boost power

Boosts are currently represented as boost objects and events.

Future versions will add:

* Weekly boost limits
* Weekly reset cycles
* Per-channel boost caps
* Anti-abuse rules
* Discovery scoring integration

---

# Phase 0 — Documentation Foundation

Status: Active / Mostly Complete

Goal:

Define the protocol before expanding smart contracts, SDKs, backend services, and frontend applications.

Current documentation includes:

* access-control.md
* architecture.md
* badge-system.md
* boost-system.md
* conduct-system.md
* customization.md
* discovery.md
* events.md
* guilds.md
* identity-object.md
* identity.md
* membership.md
* moderation.md
* onchain.md
* passport-object.md
* passport.md
* protocol.md
* recovery.md
* reputation.md
* resilience.md
* roadmap.md
* squads.md
* sui-layer.md
* systems.md
* trust-system.md
* verification.md
* vision.md

Remaining documentation cleanup:

* Update boost-system.md with weekly cycle rules
* Update membership.md with future expiration and renewal logic
* Update passport-object.md with current fields
* Update verification.md with NPC to Adventurer rules
* Update discovery.md with conduct and boost inputs

---

# Phase 1 — Core Move Protocol

Status: Core Complete

Goal:

Build and test the first stable Sui Move foundation.

Implemented modules:

* identity.move
* passport.move
* badge.move
* boost.move
* errors.move

Completed capabilities:

* Identity creation
* Passport creation
* NPC default tier
* Badge minting
* Badge points
* Curved XP progression
* Reputation updates
* Tier upgrade path
* Boost access by tier
* NPC boost restriction
* Passing test suite

Next Phase 1 improvements:

* Add more tests for curved progression
* Add tests for Prestige points after Level 100
* Add tests for invalid badge types
* Add tests for invalid tier transitions
* Add tests for boost access by Pro and Elite
* Add test helpers for repeated badge earning

---

# Phase 1.1 — Verification and Membership Authority

Status: Next Code Phase

Goal:

Move tier authority into cleaner verification and membership systems.

Planned modules:

* verification.move
* membership.move

Verification should control:

* NPC to Adventurer transition
* Human verification
* zkLogin proof integration
* X.com verification carryover
* Future Steam / Epic / SuiNS verification
* Privacy-preserving verification hooks

Membership should control:

* Adventurer to Pro
* Pro to Elite
* Expiration
* Renewal
* Effective tier checks
* Grace periods
* Subscription-aware access

Passport should remain the state object.

Verification and Membership modules should become the authority gates.

---

# Phase 1.2 — Badge Issuer Authority

Status: Planned

Goal:

Prevent badge farming and low-quality badge issuance.

Planned modules:

* badge_issuer.move
* badge_registry.move
* badge_review.move

Planned features:

* Approved badge issuers
* Badge issuer classes
* Badge type permissions
* Completion Badge restrictions
* Issuer limits
* Issuer suspension
* Badge review
* Badge revocation

Issuer classes may include:

* Nami Official
* Verified Game Developer
* Verified Channel
* Approved Guild
* Approved Event Organizer
* Partner Community

Core rule:

Badge value must depend on achievement quality, not issuer generosity or payment.

---

# Phase 1.3 — Conduct System

Status: Planned / Documented

Goal:

Add a public Passport Signal layer.

Planned Passport Signals:

* Green
* Orange
* Red
* Black

Green:

Friendly, casual, low-conflict.

Orange:

Competitive but respectful.

Red:

High-intensity, PvP-heavy, trash-talk-tolerant.

Black:

Moderation penalty state.

Public language:

```text
Passport downed. Respawning in...
```

Black Signal effects:

* Falls back to NPC-equivalent benefits
* No boosts
* No squad slots
* No guild creation
* No badge claiming
* No prestige progress
* Restricted chat access
* No discovery influence

Planned module:

* conduct.move

---

# Phase 1.4 — Moderation and Appeals

Status: Planned / Documented

Goal:

Create a fair moderation system that protects communities while avoiding mob punishment.

Planned moderation actions:

* Warning
* Temporary mute
* Channel ban
* Black Passport
* Permanent restriction
* Appeal review
* Anonymous jury review

Planned modules:

* moderation.move
* appeals.move
* jury.move

Appeals should protect identity privacy.

Jury review should use anonymized case events.

Potential jury eligibility:

* Pro or Elite membership
* Good standing
* No active Black Signal
* No recent major violations
* Minimum reputation threshold
* No conflict of interest

Jury decisions may begin as advisory before becoming protocol-binding.

---

# Phase 1.5 — Channel Access Rules

Status: Planned

Goal:

Give verified channels control over spam, access, and community safety.

Planned features:

* NPC chat toggle
* Minimum tier requirement
* Minimum reputation requirement
* Badge-gated chat
* Guild-gated chat
* Squad-gated chat
* NFT-gated chat
* Channel-specific bans
* Channel moderation tools

Core channel toggle:

```text
Allow NPC Chat: Yes / No
```

This lets verified channels decide whether free/unverified NPC users can speak in public chat.

---

# Phase 1.6 — Customization System

Status: Planned / Documented

Goal:

Make Nami Passports and profiles expressive, gamer-native, and collectible.

Planned customization categories:

* Profile avatars
* 2D VTuber-style avatars
* Profile frames
* Passport themes
* Chat overlays
* Fonts
* Chat background colors
* Message frames
* Badge displays
* Earned title displays
* Guild display selection
* Avatar accessories
* Prestige effects

Most customization settings should be off-chain.

On-chain should store:

* Unlock proofs
* Rare cosmetics
* Prestige cosmetics
* Badge ownership
* Seasonal rewards

Planned modules:

* cosmetics.move
* title.move
* avatar.move
* passport_theme.move

---

# Phase 2 — Squad System

Status: Planned

Goal:

Build small trust-based social units.

Squads are personal trust networks, not guilds.

Planned rules:

* NPC: no squad slots
* Adventurer: no squad slots
* Pro: limited squad slots
* Elite: expanded squad slots

Squad sponsorship may help trusted users support unverified or financially limited members.

Sponsored members may receive limited access depending on channel rules.

Sponsored members should not automatically receive:

* Boosts
* Guild creation rights
* Puzzle pieces
* Full reward claims
* Badge issuer permissions

Planned module:

* squad.move

---

# Phase 3 — Guild System

Status: Planned

Goal:

Build persistent community structures.

Guilds should support:

* Guild identity
* Guild roles
* Guild membership
* Guild reputation
* Guild events
* Guild badge permissions
* Guild discovery
* Future governance

Guild creation may require:

* Verification
* Minimum reputation
* Founding members
* No active Black Signal
* No recent severe moderation history

Planned module:

* guild.move

---

# Phase 4 — Discovery System

Status: Planned

Goal:

Build community-driven discovery for channels, games, guilds, events, and developers.

Discovery inputs may include:

* Boosts
* Reputation
* Badge quality
* Conduct Signal
* Channel activity
* Guild activity
* Squad activity
* Developer verification
* Engagement quality
* Moderation health

Boosts should influence discovery but not fully control it.

Discovery should not become pay-to-win visibility.

Planned components:

* discovery engine
* ranking indexer
* weekly boost cycle processor
* anti-abuse scoring
* channel reputation analytics

---

# Phase 5 — Communication Layer

Status: Planned

Goal:

Build Nami world chat, developer hubs, announcements, and embedded chat.

Planned communication features:

* Main world timeline
* Developer hubs
* Game channels
* Guild channels
* Squad channels
* Badge-gated chats
* NFT-gated chats
* Announcement banners
* Embedded SDK chat
* Channel moderation tools

Messaging should be off-chain for speed.

Sui should anchor identity, access, reputation, badges, and proof.

---

# Phase 6 — SDK and Integration Layer

Status: Planned

Goal:

Let any game, website, dApp, or community integrate Nami.

Planned SDKs:

* Web SDK
* Game SDK
* dApp SDK
* Future Unity support
* Future Unreal support

SDK should expose:

* Login
* Identity
* Passport
* Membership
* Reputation
* Badges
* Boosts
* Conduct Signal
* Channel access
* Squads
* Guilds
* Messaging
* Customization

---

# Phase 7 — Backend Services

Status: Planned

Goal:

Build scalable off-chain systems that support Nami experiences.

Backend services may include:

* Indexer
* Profile service
* Chat service
* Discovery engine
* Moderation service
* Appeal service
* Jury assignment service
* Customization service
* Badge issuer service
* Recovery service
* Notification service

Off-chain systems should compute intelligence.

Sui should store proof and ownership.

---

# Phase 8 — Privacy and Recovery

Status: Planned

Goal:

Protect gamer identity while supporting account recovery.

Recovery paths may include:

* zkLogin recovery
* Linked social recovery
* Linked game account recovery
* Optional email recovery
* Squad support
* Guild support
* Manual review

Privacy goals:

* Verify humanity without exposing unnecessary wallet data
* Protect linked account information
* Keep appeal juries anonymous
* Keep case identities private
* Avoid unnecessary doxxing of gamers

---

# Phase 9 — Seasonal Progression and Prestige

Status: Planned

Goal:

Support long-term engagement through seasons, resets, and prestige.

Current progression direction:

* Level 100 should require dedication
* Seasons may reset around 6 months
* Fast early progression should feel rewarding
* Higher levels should slow down
* Level 100 users can earn Prestige progress

Future Prestige systems may include:

* Prestige titles
* Prestige cosmetics
* Passport effects
* Profile frames
* Rare badge effects
* Seasonal honors
* Puzzle piece rewards

---

# Phase 10 — Developer and Channel Ecosystem

Status: Planned

Goal:

Support developers, games, and multi-game studios.

Developer systems may include:

* Developer verification
* Studio profiles
* Game directories
* Developer hubs
* Channel ownership
* Badge issuer authority
* Announcement banners
* Channel branding
* Game-specific Passport integrations

Multi-game studios should be able to use a directory structure instead of forcing every game into a separate isolated channel.

---

# Long-Term Vision

Nami becomes the persistent identity and trust layer for gaming.

A player should be able to carry their:

* Identity
* Passport
* Reputation
* Badges
* Titles
* Conduct Signal
* Membership access
* Guild history
* Squad relationships
* Customization
* Prestige
* Developer relationships
* Discovery influence

across every connected experience.

Nami should feel like a world gamers enter, not a form they fill out.

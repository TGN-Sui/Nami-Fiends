# Nami Systems Overview

## Overview

Nami is built as a modular gaming identity protocol.

Each system has a clear responsibility so that access, reputation, conduct, moderation, discovery, and communication do not become tangled together.

Nami systems should remain composable, upgradeable, and easy to reason about.

---

## Core Principle

Each system should answer one primary question.

Identity answers:

Who owns this presence?

Passport answers:

What has this player done?

Membership answers:

What can this player access?

Reputation answers:

What has this player earned?

Conduct answers:

What kind of interaction should others expect?

Moderation answers:

What restrictions are currently applied?

Discovery answers:

What should the community see?

Customization answers:

How does the player express identity?

---

# System Map

Nami currently includes or plans the following systems:

* Identity System
* Passport System
* Membership System
* Verification System
* Reputation System
* Badge System
* Boost System
* Conduct System
* Moderation System
* Appeals and Jury System
* Channel Access System
* Customization System
* Squad System
* Guild System
* Discovery System
* Communication System
* Recovery System
* Sui Layer
* Backend Services
* SDK and Integration Layer

---

# Identity System

## Purpose

The Identity System is the root ownership layer.

It represents the user-controlled identity anchor for Nami.

---

## Current Responsibilities

Identity currently supports:

* Owner tracking
* zkLogin / wallet-compatible ownership
* Verification level placeholder
* Trust tier placeholder
* Passport reference placeholder
* Creation timestamp
* Versioning

---

## Should Not Handle

Identity should not store:

* XP
* Reputation
* Badges
* Chat messages
* Guild memberships
* Squad relationships
* Moderation evidence
* Profile cosmetics

Identity should remain small and stable.

---

# Passport System

## Purpose

The Passport System is the gamer journey layer.

It stores progression, reputation, membership state, archetype, and future prestige progress.

---

## Current Responsibilities

Passport currently supports:

* XP
* Level
* Level progress
* Badge points
* Reputation
* Archetype
* Membership tier
* Boost score placeholder
* Prestige points
* Tier upgrade state
* Progression events

---

## Important Boundaries

Passport stores state.

Other systems should become authorities that control when Passport state changes.

Examples:

* Verification should control NPC → Adventurer
* Membership should control Pro / Elite access
* Badge issuer systems should control badge point awards
* Moderation should control Black Signal restrictions

---

# Membership System

## Purpose

Membership controls access to Nami features.

Membership does not represent contribution or trust by itself.

---

## Current Tiers

* NPC
* Adventurer
* Pro
* Elite

---

## Responsibilities

Membership controls:

* Boost access
* Premium feature access
* Future squad slots
* Future jury eligibility
* Future customization capacity
* Future renewal and expiration logic

---

## Should Not Handle

Membership should not:

* Increase reputation directly
* Override moderation
* Grant badge authority automatically
* Grant governance control automatically

---

# Verification System

## Purpose

Verification determines whether a user has proven enough humanity or account authenticity for trusted access.

---

## Responsibilities

Verification should support:

* NPC to Adventurer transition
* Human verification
* zkLogin integration
* X.com verification carryover
* SuiNS verification
* Steam / Epic linkage
* Future privacy-preserving proofs
* Recovery support

---

## Boundary

Verification proves authenticity.

It does not prove contribution.

Reputation still must be earned.

---

# Reputation System

## Purpose

Reputation reflects contribution, activity quality, and earned standing.

---

## Current Ranks

* Newbie
* Gamester
* Goblin
* Goonie
* Fiend

---

## Inputs

Reputation is influenced by:

* Badge points
* XP
* Level progression
* Future contribution systems

---

## Boundary

Reputation cannot be purchased.

Membership should not directly increase reputation.

Conduct should not directly replace reputation.

---

# Badge System

## Purpose

Badges are proof of meaningful achievement, participation, or contribution.

---

## Current Badge Types

* Basic Badge
* Event Badge
* Completion Badge

---

## Current Points

* Basic Badge = 1 point
* Event Badge = 2 points
* Completion Badge = 3 points

---

## Responsibilities

Badges currently:

* Mint badge objects
* Add badge points
* Feed XP progression
* Influence reputation

---

## Future Responsibilities

Future badge systems should support:

* Badge issuer approval
* Badge quality review
* Badge revocation
* Badge issuer limits
* Completion Badge restrictions

---

# Boost System

## Purpose

Boosts are discovery signals.

They help members support channels and communities during discovery cycles.

---

## Current Boost Model

* NPC: no boost access
* Adventurer: 1 boost power
* Pro: 6 boost power
* Elite: 8 boost power

---

## Responsibilities

Boosts should support:

* Weekly discovery cycles
* Channel visibility signals
* Community-driven discovery
* Future anti-abuse rules
* Future per-channel caps

---

## Boundary

Boosts are not:

* Governance
* Reputation
* Moderation power
* Badge authority
* Ownership rights

---

# Conduct System

## Purpose

Conduct communicates public interaction style and current moderation standing.

---

## Passport Signals

* Green
* Orange
* Red
* Black

---

## Responsibilities

Conduct should help users understand what kind of interaction to expect.

Green:

Friendly / casual.

Orange:

Competitive but respectful.

Red:

High-intensity / PvP-heavy.

Black:

Moderation penalty state.

---

## Boundary

Conduct is not membership.

Conduct is not reputation.

Red is not punishment.

Black is punishment.

---

# Moderation System

## Purpose

Moderation protects communities and the protocol from abuse.

---

## Moderation Actions

Planned moderation actions:

* Warning
* Temporary mute
* Channel ban
* Black Passport
* Permanent restriction
* Appeal review

---

## Responsibilities

Moderation should:

* Apply restrictions
* Protect communities
* Create audit trails
* Enable appeals
* Prevent abuse
* Avoid mob punishment

---

# Appeals and Jury System

## Purpose

The Appeals and Jury System gives restricted users a fair review path while allowing selected community members to participate.

---

## Responsibilities

Appeals may support:

* Appeal case creation
* Anonymized case review
* Pro / Elite jury pools
* Jury recommendations
* Final moderation review
* Public event transparency

---

## Privacy Boundary

Appeals should not expose:

* Wallet addresses
* Real names
* Email addresses
* Linked social accounts
* Private unrelated messages
* Sensitive recovery information

Juries should review anonymized events and evidence summaries.

---

# Channel Access System

## Purpose

Channel Access controls who can read, chat, and participate in different channel spaces.

---

## Planned Access Modes

* Public read
* NPC chat allowed
* NPC chat disabled
* Adventurer+ chat
* Pro+ chat
* Elite-only chat
* Reputation-gated chat
* Badge-gated chat
* Guild-gated chat
* Squad-gated chat
* NFT-gated chat

---

## Core Toggle

Verified channels should have a simple option:

Allow NPC Chat: Yes / No

This helps reduce spam while preserving public discovery.

---

# Customization System

## Purpose

Customization lets users express identity visually.

---

## Customization Types

Customization may include:

* Profile avatars
* 2D VTuber-style avatars
* Profile frames
* Passport themes
* Chat overlays
* Fonts
* Chat backgrounds
* Badge displays
* Title displays
* Guild display selection
* Avatar accessories
* Prestige effects

---

## Boundary

Customization should not create pay-to-win reputation.

Membership may increase display capacity, but earned achievements should remain meaningful.

---

# Squad System

## Purpose

Squads are small trust and social groups.

They support sponsorship, lightweight community bonding, and personal trust networks.

---

## Planned Rules

* NPC: no squad slots
* Adventurer: no squad slots
* Pro: limited squad slots
* Elite: expanded squad slots

---

## Boundary

Squads are not guilds.

Squads should not automatically grant:

* Boosts
* Guild creation rights
* Puzzle pieces
* Full reward claims
* Badge issuer authority

---

# Guild System

## Purpose

Guilds are larger persistent community structures.

---

## Planned Responsibilities

Guilds may support:

* Guild identity
* Guild roles
* Guild membership
* Guild reputation
* Guild channels
* Guild events
* Guild badges
* Guild discovery
* Future governance

---

## Boundary

Guilds should not override global Nami moderation.

Guild leaders should manage guild spaces, not the entire protocol.

---

# Discovery System

## Purpose

Discovery helps users find quality channels, communities, games, events, squads, and guilds.

---

## Inputs

Discovery may use:

* Boosts
* Reputation
* Badge quality
* Conduct health
* Channel activity
* Guild activity
* Squad activity
* Developer verification
* Channel verification
* Moderation health
* Event participation

---

## Boundary

Discovery should not be controlled by payment alone.

Boosts are one input, not the whole ranking system.

---

# Communication System

## Purpose

Communication connects users, developers, guilds, squads, and communities.

---

## Planned Features

* World chat
* Developer hubs
* Game channels
* Guild channels
* Squad channels
* Badge-gated chats
* NFT-gated chats
* Announcement banners
* SDK embedded chat

---

## Boundary

Chat messages should primarily live off-chain for speed and scale.

Sui should anchor identity, access, ownership, badges, and proof.

---

# Recovery System

## Purpose

Recovery helps users regain access to their Identity and Passport without compromising ownership or safety.

---

## Planned Recovery Methods

* zkLogin recovery
* Linked social recovery
* Linked game account recovery
* Optional email recovery
* Squad support
* Guild support
* Manual review

---

## Boundary

Recovery must not expose private identity information to public juries or communities.

---

# Sui Layer

## Purpose

The Sui Layer provides on-chain ownership, identity, proof, access, and events.

---

## Current On-Chain Modules

* identity.move
* passport.move
* badge.move
* boost.move
* errors.move

---

## Future On-Chain Modules

Potential future modules:

* verification.move
* membership.move
* conduct.move
* moderation.move
* appeals.move
* jury.move
* channel_access.move
* squad.move
* guild.move
* badge_issuer.move
* cosmetics.move

---

# Backend Services

## Purpose

Backend services handle scalable off-chain computation and user-facing systems.

---

## Planned Services

* Event indexer
* Chat service
* Discovery engine
* Profile service
* Moderation service
* Appeal service
* Jury assignment service
* Customization service
* Badge issuer service
* Recovery service
* Notification service

---

# SDK and Integration Layer

## Purpose

The SDK allows games, websites, dApps, developers, and communities to integrate Nami.

---

## Planned SDK Features

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
* Chat
* Customization
* Events

---

# System Dependency Flow

Current core dependency flow:

```text id="4wetk3"
Identity
  ↓
Passport
  ↓
Badge System
  ↓
XP / Level / Reputation
  ↓
Boost Access
```

Future expanded flow:

```text id="o72qes"
Identity
  ↓
Passport
  ├── Verification
  ├── Membership
  ├── Reputation
  ├── Conduct
  ├── Badges
  ├── Boosts
  ├── Squads
  ├── Guilds
  ├── Customization
  └── Recovery
```

---

# Design Principles

Each system should have one clear responsibility.

State should be stored where it belongs.

Access should not equal reputation.

Reputation should not be purchasable.

Conduct should not be confused with personality.

Moderation should be reviewable.

Discovery should reward quality.

Customization should express identity.

Sui should anchor proof.

Off-chain systems should handle scale.

Nami should feel like a world, not a login form.

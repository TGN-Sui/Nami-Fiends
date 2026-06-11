# Nami Protocol Roadmap

## Vision

Nami is the ultimate interoperable identity layer for gamers.

The protocol gives players a persistent identity, passport, reputation, badge history, membership access, squads, guilds, discovery influence, and future communication tools across games, apps, websites, and communities.

Nami is not only a chat product.

Nami is a gaming identity, trust, progression, and discovery protocol.

---

## Phase 0 — Protocol Documentation Foundation

Status: In Progress

Goal:

Define the system before expanding smart contracts, SDKs, backend services, and frontend applications.

Current documentation:

- vision.md
- protocol.md
- architecture.md
- systems.md
- access-control.md
- identity.md
- identity-objects.md
- passport.md
- passport-object.md
- reputation.md
- verification.md
- trust-system.md
- recovery.md
- events.md
- resilience.md
- discovery.md
- squads.md
- guilds.md
- onchain.md
- sui-layer.md

Needed documentation cleanup:

- Complete passport-object.md
- Add membership.md
- Add badge-system.md
- Add boost-system.md
- Add roadmap.md

---

## Phase 1 — Core On-Chain Identity Layer

Status: Active

Goal:

Build the minimum Sui Move protocol foundation.

Core modules:

- errors.move
- identity.move
- passport.move
- badge.move
- boost.move

Current system responsibilities:

### Identity

Represents the user-owned root identity.

Identity should remain small and stable.

It should not store XP, badges, reputation, chat data, guild membership, or profile cosmetics.

---

### Passport

Represents the gamer journey.

Passport stores:

- XP
- Level
- Reputation
- Badge points
- Archetype
- Membership tier
- Boost score

Important separation:

- Reputation is earned
- Membership tier controls access
- Archetype represents onboarding gamer identity

---

### Membership Tiers

Membership/access tiers:

- NPC
- Adventurer
- Pro
- Elite

NPC is the default unverified/free state.

Adventurer is the verified human/basic access state.

Pro and Elite are higher access tiers.

Future versions will add expiration and renewals.

---

### Reputation Tiers

Reputation/progression tiers:

- Newbie
- Gamester
- Goblin
- Goonie
- Fiend

Reputation is based on XP, badge points, participation, and future contribution signals.

Reputation cannot be purchased.

---

### Badges

Badges are on-chain achievement proofs.

Initial badge types:

- Basic Badge
- Event Badge
- Completionist Badge

Badges add points to the Passport.

Badge points influence reputation.

---

### Boosts

Boosts are discovery signals.

Boost power is based on Passport membership tier:

- NPC: no boost access
- Adventurer: 2 boost
- Pro: 6 boosts
- Elite: 8 boosts

Boosts are not governance.

Boosts do not grant ownership or moderation rights.

---

## Phase 2 — Membership Authority Layer

Goal:

Harden membership access.

Planned additions:

- Tier expiration
- Tier renewal
- Membership renewal events
- Effective tier checks
- Subscription-aware access logic
- Grace period handling

Important future rule:

A user's visible tier may expire.

Expired Pro or Elite membership should fall back to Adventurer or NPC depending on verification status.

---

## Phase 3 — Verification Layer

Goal:

Connect human verification to tier upgrades.

Planned verification sources:

- zkLogin
- X.com verification
- Sui wallet ownership
- SuiNS
- Steam
- Epic Games
- Future privacy-preserving verification systems

Verification should allow:

- NPC to Adventurer transition
- improved trust signals
- reduced sybil risk
- future recovery support

---

## Phase 4 — Squad System

Goal:

Create trust-based player sponsorship and onboarding.

Squad rules:

- NPC: no squad slots
- Adventurer: no squad slots
- Pro: limited squad slots
- Elite: expanded squad slots

Squads should support:

- Sponsoring non-verified members
- Public squad display
- Weekly auto-renewal
- Trust-based onboarding

Squads are not guilds.

Squads are personal trust networks.

---

## Phase 5 — Guild System

Goal:

Create persistent gaming communities.

Guilds should support:

- Guild identity
- Guild roles
- Guild membership
- Guild reputation
- Guild discovery
- Guild badges
- Future governance

Guilds are larger community structures.

Squads are smaller trust/social units.

---

## Phase 6 — Discovery System

Goal:

Use boosts, reputation, trust, and activity to surface channels and communities.

Discovery inputs:

- Boosts
- Engagement
- Reputation
- Badge quality
- Verified game channels
- Guild activity
- Squad activity

Discovery should be community-driven, not ad-driven.

---

## Phase 7 — Communication Layer

Goal:

Add Nami chat, world chat, developer hubs, announcements, and embedded messaging.

Communication should support:

- Main world timeline
- Developer hubs
- Game channels
- Guild channels
- Squad channels
- Badge/NFT gated chats
- Announcement banners
- SDK integration

Primary messaging should be off-chain for speed.

Sui should anchor trust, access, ownership, and proof.

---

## Phase 8 — SDK and Integration Layer

Goal:

Allow games, websites, dApps, and communities to integrate Nami.

Planned SDKs:

- Web SDK
- Game SDK
- dApp integration layer
- Future Unity/Unreal support

SDK should expose:

- Login
- Identity
- Passport
- Badges
- Reputation
- Membership
- Boosts
- Squads
- Guilds
- Channels
- Messaging

---

## Phase 9 — Privacy and Recovery

Goal:

Protect gamer privacy while supporting identity recovery.

Recovery paths:

- zkLogin recovery
- Linked social recovery
- Linked game account recovery
- Optional email recovery
- Squad/Guild assisted manual recovery

Privacy goals:

- Verify humanity without exposing unnecessary wallet data
- Support privacy-conscious gamers
- Enable proof without public doxxing

---

## Long-Term Goal

Nami becomes the persistent gaming identity layer used across games, websites, applications, communities, guilds, creators, and developer ecosystems.

Players should be able to carry their:

- Identity
- Passport
- Badges
- Reputation
- Guild history
- Squad relationships
- Discovery influence
- Achievements

across every connected experience.
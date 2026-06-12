# Nami Protocol

## Overview

Nami is an interoperable gaming identity, reputation, trust, discovery, and communication protocol.

Nami gives gamers a persistent Passport that can travel across games, websites, dApps, developer hubs, guilds, squads, and communities.

Nami is not only a chat application.

Nami is a gaming identity protocol with chat, discovery, reputation, and community systems layered on top.

---

## Core Mission

Nami exists to answer one question:

Who is this player across their gaming life?

A player should be able to carry their:

* Identity
* Passport
* Badges
* Reputation
* Membership access
* Conduct signal
* Squad relationships
* Guild history
* Titles
* Customization
* Discovery influence

across every connected Nami experience.

---

## Core Protocol Layers

Nami is organized into independent but connected layers:

1. Identity
2. Passport
3. Membership
4. Reputation
5. Badge System
6. Boost System
7. Conduct System
8. Moderation System
9. Customization System
10. Squads
11. Guilds
12. Discovery
13. Communication
14. Recovery

Each layer has a separate responsibility.

This separation prevents payment, reputation, conduct, punishment, and personality from becoming one confusing score.

---

# Identity Layer

## Purpose

Identity is the root ownership layer.

Identity answers:

Who owns this Nami presence?

Identity should remain small, stable, and future-proof.

---

## Identity Responsibilities

Identity may track:

* Owner
* Verification level
* Trust tier
* Passport reference
* Creation timestamp
* Version

Identity should not store:

* XP
* Level
* Badges
* Reputation
* Chat data
* Guild membership
* Squad relationships
* Profile cosmetics
* Moderation evidence

---

## zkLogin and Wallet Ownership

Nami is designed to support zkLogin and wallet-based ownership.

Users should be able to enter Nami without needing to understand blockchain mechanics.

A user may sign in through zkLogin, and the protocol can associate that login with their Identity and Passport.

---

# Passport Layer

## Purpose

Passport is the gamer journey layer.

Passport answers:

What has this player done?

Passport tracks progression, reputation, archetype, membership tier, badge score, and future prestige progress.

---

## Passport Responsibilities

Passport currently stores:

* XP
* Level
* Level progress
* Badge points
* Reputation
* Archetype
* Membership tier
* Boost score
* Prestige points
* Creation timestamp

---

## Passport Creation

Every Passport starts with:

* Level 1
* 0 XP
* 0 badge points
* Newbie reputation
* NPC membership tier
* Selected onboarding archetype
* 0 prestige points

NPC is the default free and unverified tier.

---

## Archetypes

Archetypes represent the type of gamer a user identifies with during onboarding.

Archetypes may include:

* Explorer
* Competitor
* Collector
* Social Gamer
* Creator
* Wildcard

Archetypes are identity flavor, not access power.

---

# Membership Layer

## Purpose

Membership controls feature access.

Membership does not equal reputation.

Membership does not prove skill.

Membership does not override moderation.

---

## Membership Tiers

### NPC

Default free and unverified state.

NPC users may view public areas and participate only where channels allow NPC activity.

NPC users do not receive boost access.

---

### Adventurer

Verified human or basic membership tier.

Adventurer users receive basic verified access and 2 boost per cycle.

---

### Pro

Full-access supporter tier.

Pro users receive expanded access, 6 boosts per cycle, and future squad sponsorship eligibility.

---

### Elite

Premium supporter tier.

Elite users receive premium access, 8 boosts per cycle, expanded customization, and future jury eligibility.

Elite does not grant immunity from moderation.

---

## Membership Expiration

Future versions will support membership expiration and renewal.

Expired Pro or Elite users should lose active benefits.

Expired users may fall back to Adventurer if still verified, or NPC if not verified.

---

# Reputation Layer

## Purpose

Reputation reflects contribution, progression, and earned standing.

Reputation cannot be purchased.

---

## Reputation Ranks

Current reputation ranks:

* Newbie
* Gamester
* Goblin
* Goonie
* Fiend

Reputation is influenced by:

* XP
* Badge points
* Level progression
* Meaningful achievements
* Future contribution systems

---

## Reputation Rules

Membership tier does not affect reputation.

Conduct signal does not directly define reputation.

Reputation should reward meaningful effort over passive presence.

---

# Badge System

## Purpose

Badges are proof of meaningful actions.

Badges feed Passport progression through badge points and XP.

---

## Badge Types

Current badge types:

* Basic Badge: 1 point
* Event Badge: 2 points
* Completion Badge: 3 points

---

## Badge Quality

Badges must represent meaningful activity.

Starting a game must not issue a Completion Badge.

Opening a game must not issue a Completion Badge.

Joining a channel must not issue a Completion Badge.

Completion Badges should require meaningful verified completion.

---

## Badge Issuers

Future badge issuers may include:

* Nami Official
* Verified Game Developers
* Verified Channels
* Approved Guilds
* Approved Events
* Partner Communities

Badge issuer authority must be controlled to prevent reputation farming.

---

# Boost System

## Purpose

Boosts are community discovery signals.

Boosts help surface channels, games, guilds, and communities.

Boosts are not governance.

Boosts do not grant ownership or moderation rights.

---

## Boost Power

Current boost model:

* NPC: 0 boosts
* Adventurer: 2 boost
* Pro: 6 boosts
* Elite: 8 boosts

Black Passport status disables boost access regardless of membership tier.

---

## Weekly Cycles

Boosts are intended to reset weekly.

Boosts should encourage fresh discovery cycles and prevent permanent dominance.

---

# Conduct System

## Purpose

Conduct adds a public interaction signal to the Passport.

Conduct answers:

What type of interaction should others expect from this player right now?

Conduct is separate from membership and reputation.

---

## Passport Signals

Current planned signals:

* Green
* Orange
* Red
* Black

---

## Green Signal

Friendly, casual, low-conflict player.

---

## Orange Signal

Competitive but respectful player.

---

## Red Signal

High-intensity, PvP-heavy, trash-talk-tolerant player.

Red is not a punishment state.

---

## Black Signal

Moderation penalty state.

A Black Passport means:

Passport downed. Respawning in...

During Black status, the user falls back to NPC-equivalent benefits until the penalty expires or is resolved.

---

# Moderation System

## Purpose

Moderation protects communities while preserving fairness, privacy, and player voice.

Moderation should be evidence-based, reviewable, and resistant to mob abuse.

---

## Moderation Actions

Moderation may include:

* Warning
* Temporary mute
* Channel ban
* Black Passport
* Permanent restriction
* Appeal review
* Anonymous jury review

---

## Appeals

Restricted users may appeal moderation actions.

Appeals should protect user privacy and avoid exposing real identities, wallet addresses, private linked accounts, or unrelated private messages.

---

## Anonymous Jury Review

Future appeal cases may be reviewed by selected anonymous juries made up of eligible Pro and Elite members.

Jury members should see anonymized case events, not private identity information.

Jury decisions may begin as advisory before becoming protocol-binding.

---

# Customization System

## Purpose

Customization allows players to express identity visually.

Customization should enhance profile, Passport, chat, avatar, guild, and channel experiences without creating pay-to-win mechanics.

---

## Customization Categories

Customization may include:

* Profile avatars
* 2D VTuber-style avatars
* Profile frames
* Passport themes
* Chat overlays
* Fonts
* Background colors
* Badge displays
* Earned title displays
* Guild display selection
* Avatar accessories
* Prestige effects

---

## Unlock Sources

Customization may be unlocked through:

* Membership
* Reputation
* Badges
* Events
* Guild achievements
* Squad participation
* Puzzle pieces
* Prestige milestones
* Developer rewards

Membership may increase cosmetic capacity, but earned achievements should remain meaningful.

---

# Channel Access

## Purpose

Channels should be able to control chat access and reduce bot spam.

Verified channels may toggle whether NPC users can chat.

---

## Channel Modes

Possible channel access modes:

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

This allows channels to protect their communities while remaining discoverable.

---

# Squads

## Purpose

Squads are small trust and social groups.

Squads help users onboard others, show social relationships, and form lightweight community bonds.

Squads are not guilds.

Squads are smaller, more personal, and more temporary.

---

## Future Squad Rules

Future squad permissions may include:

* NPC: no slots
* Adventurer: no slots
* Pro: limited slots
* Elite: expanded slots

Sponsored users may receive limited access depending on channel rules.

Sponsorship should not automatically grant boosts, guild creation, puzzle pieces, or full reward access.

---

# Guilds

## Purpose

Guilds are persistent gaming communities.

Guilds support larger social structures, identity, events, roles, and future governance.

---

## Guild Responsibilities

Guilds may support:

* Guild identity
* Guild roles
* Guild channels
* Guild reputation
* Guild events
* Guild badges
* Guild discovery
* Future governance

Guilds should be larger community anchors.

Squads should remain smaller social units.

---

# Discovery

## Purpose

Discovery helps users find channels, games, guilds, events, and communities.

Discovery should be community-driven, not ad-driven.

---

## Discovery Inputs

Discovery may use:

* Boosts
* Reputation
* Badge quality
* Engagement
* Guild activity
* Squad activity
* Verified channel quality
* Developer activity
* Conduct safety signals

Boosts should influence discovery but not fully control it.

---

# Communication

## Purpose

Nami communication connects players, developers, guilds, squads, and communities.

Nami may support:

* Main world chat
* Developer hubs
* Game channels
* Guild channels
* Squad channels
* Badge-gated chats
* NFT-gated chats
* Announcement banners
* Embedded SDK chat

Messaging should be fast and scalable.

Sui should anchor identity, ownership, access, and proof.

---

# Recovery

## Purpose

Recovery protects users from losing long-term gaming identity.

Recovery should preserve:

* Identity
* Passport
* Badges
* Reputation
* Membership history
* Guild history
* Squad relationships
* Future prestige

---

## Recovery Methods

Future recovery may include:

* zkLogin recovery
* Linked social recovery
* Linked game account recovery
* Optional email recovery
* Squad or guild support
* Manual review

Recovery must remain privacy-conscious and resistant to abuse.

---

# On-Chain and Off-Chain Responsibilities

## On-Chain

Sui Move should store:

* Identity ownership
* Passport state
* Badge ownership
* Membership proof
* Boost events
* Conduct status proofs
* Moderation status proofs
* Recovery proofs
* Guild and squad anchors

---

## Off-Chain

Off-chain systems should handle:

* Chat messages
* Discovery ranking
* Moderation evidence
* Appeal evidence
* Customization settings
* Avatar configuration
* Channel analytics
* Notification systems
* Search and recommendations

---

# Core Protocol Principles

## Identity First

Nami begins with persistent gamer identity.

---

## Reputation Is Earned

Reputation reflects contribution and achievement, not spending.

---

## Membership Controls Access

Membership unlocks features but does not purchase trust.

---

## Conduct Communicates Interaction

Conduct signals help users find compatible communities.

---

## Moderation Must Be Fair

Moderation must protect users while avoiding mob punishment.

---

## Badges Must Matter

Badges should represent real achievement or participation.

---

## Discovery Should Be Community-Driven

Boosts and reputation should help surface quality communities.

---

## Privacy Matters

Nami should support verification and recovery without unnecessary exposure of private identity data.

---

## Interoperability Is The Goal

Nami should work across games, websites, dApps, developer hubs, guilds, squads, and future gaming ecosystems.

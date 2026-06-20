# Nami Passport

## Overview

The Nami Passport is the player journey layer of the Nami ecosystem.

It represents a gamer’s progression, reputation, membership state, badge history, archetype, and future prestige journey.

Identity answers:

Who owns this Nami presence?

Passport answers:

What has this player done?

The Passport is designed to become a persistent gaming record that can travel across games, channels, guilds, squads, developer hubs, and future Nami-connected experiences.

---

## Core Purpose

The Passport gives every player a persistent profile of earned activity.

It helps track:

* XP
* Level
* Level progress
* Badge points
* Reputation
* Membership tier
* Archetype
* Boost-related state
* Future Prestige progress

Passport data should represent meaningful activity, not passive presence.

---

## Passport Creation

Every Nami user can receive a Passport.

A new Passport starts with:

```text
Level: 1
XP: 0
Level Progress: 0
Badge Points: 0
Reputation: Newbie
Membership Tier: NPC
Prestige Points: 0
```

During onboarding, users choose a gamer archetype.

The archetype represents identity flavor and playstyle preference.

It does not grant special access or reputation.

---

## NPC Default State

Every new Passport starts as NPC.

NPC means:

* Free user
* Unverified
* Limited access
* No boost access
* No premium benefits

NPC allows users to enter Nami easily while protecting the protocol from spam, bots, and abuse.

NPC is not a punishment state.

NPC is the default starting point.

---

## Test Launch Genesis State

Official testnet builds (`VITE_NAMI_TEST_LAUNCH=true`) start every real signed-in user at a **genesis passport** — no fixture progression, badges, or chat history.

Genesis snapshot (frontend):

```text
Level: 1
XP: 0
Membership display tier: NPC
Guilds / squads: none
Badges: onboarding flavor badge only (from member session quiz)
Chat logs: empty (one-time purge of dev-seeded localStorage on first test-launch boot)
```

Implementation:

```text
frontend/src/genesis-member.ts       — shouldUseGenesisSelfMember(), applyGenesisSelfOverrides()
frontend/src/member-progression.ts   — GENESIS_PROGRESSION for self member (m1)
frontend/src/global-chats.ts         — getUserCollectedBadges() returns onboarding badge only
```

Fixture catalogs (`VITE_NAMI_DEV_FIXTURES=true`) remain available for local polish only; test launch forces them off.

---

## FIEND Owner Display Identity

The official Nami owner (`VITE_NAMI_OFFICIAL_OWNER` wallet, matched via zkLogin or linked wallet) receives an exclusive display rank label:

```text
FIEND
```

FIEND is **not** the reputation rank `Fiend` (earned progression). It is a sole-owner identity label shown instead of NPC or paid membership tier chips on passport surfaces.

Owner styling (frontend):

```text
Galaxy passport foil (is-nami-official-galaxy-passport)
Rainbow avatar and chat bubble borders (is-nami-rainbow-foil-border)
Profile badge and passport header: FIEND / FIEND Passport
```

Implementation:

```text
frontend/src/channel-surface.ts      — OFFICIAL_OWNER_RANK_LABEL, isFiendMember(), memberDisplayRankLabel()
frontend/src/genesis-member.ts       — sets isNamiBoss on self member when resolveNamiAdminRole === official-owner
frontend/src/official-membership-access.ts — complimentary Elite features without payment
```

Official Nami Team members keep a separate **Official Nami Team** label. Galaxy and rainbow styling are reserved for the FIEND owner only.

---

## Membership Tier

Passport stores the current membership/access tier.

Current tiers:

```text
0 = NPC
1 = Adventurer
2 = Pro
3 = Elite
```

Membership controls access.

Membership does not determine reputation.

Membership does not override moderation.

---

## Membership Path

The intended membership path is:

```text
NPC → Adventurer → Pro → Elite
```

### NPC

Default free and unverified state.

No boosts.

Limited access depending on channel rules.

---

### Adventurer

Verified human or basic membership state.

Current benefit:

```text
2 boost per cycle
```

---

### Pro

Supporter/full-access tier.

Current benefit:

```text
6 boosts per cycle
```

Future benefits may include limited squad sponsorship slots, expanded customization, and jury eligibility.

---

### Elite

Premium supporter tier.

Current benefit:

```text
8 boosts per cycle
```

Future benefits may include expanded squad sponsorship slots, premium customization, and stronger community participation features.

Elite does not grant immunity from moderation.

---

## Membership Expiration

Future versions will support membership expiration and renewal.

Pro and Elite benefits should not remain active forever without renewal.

When membership expires:

* Boost access should be recalculated
* Premium benefits should pause
* Squad slots may become inactive
* Jury eligibility should be removed
* Customization capacity may be restricted

If the user remains verified, they may fall back to Adventurer.

If not verified, they may fall back to NPC.

Expiration should not erase Passport history.

---

## Reputation

Passport stores reputation rank.

Current ranks:

```text
0 = Newbie
1 = Gamester
2 = Goblin
3 = Goonie
4 = Fiend
```

Reputation is earned.

Reputation is not purchased.

Reputation reflects meaningful activity, badge quality, and progression.

---

## Reputation vs Membership

Reputation and membership are separate.

A user may be:

* NPC with meaningful history
* Adventurer with low reputation
* Pro with low reputation
* Elite with high reputation
* Elite with Black Signal

Membership controls access.

Reputation reflects contribution.

---

## Badge Points

Badges are the current primary source of Passport progression.

Current badge point model:

```text
Basic Badge = 1 point
Event Badge = 2 points
Completion Badge = 3 points
```

Badge points feed:

* XP
* Level progression
* Reputation progression

Badge points should come from meaningful activity.

Starting a game should not create a Completion Badge.

Opening a game should not create a Completion Badge.

Joining a channel should not create a Completion Badge.

---

## XP and Level Progression

Nami uses curved level progression.

The goal is:

* Fast early levels
* Slower higher levels
* Meaningful long-term progression
* Level 100 as a dedication milestone
* Seasonal reset compatibility

XP currently comes from badge points.

Because badges provide 1, 2, or 3 points, the level curve prevents a single badge from creating excessive level jumps.

---

## Level 100

Level 100 is designed to represent meaningful dedication.

Design direction:

```text
A highly dedicated player may reach Level 100 in roughly 3 months.
A steady player may take closer to a full season.
```

Future seasonal cycles may reset around 6 months.

Level 100 should feel like an accomplishment.

---

## Prestige

Prestige is planned for players who reach Level 100 early.

After Level 100, additional XP may become Prestige progress.

Prestige may later unlock:

* Prestige titles
* Passport effects
* Profile frames
* Rare cosmetics
* Seasonal honors
* Badge effects
* Puzzle pieces

Prestige should reward dedication without making new players feel permanently locked out.

---

## Archetype

Archetype represents the type of gamer the user identifies as during onboarding.

Possible archetypes may include:

* Explorer
* Competitor
* Collector
* Social Gamer
* Creator
* Wildcard

Archetypes are not reputation.

Archetypes are not membership.

Archetypes are identity flavor.

---

## Boost Relationship

Boosts read the Passport membership tier.

Current boost access:

```text
NPC = no boost access
Adventurer = 1 boost
Pro = 6 boosts
Elite = 8 boosts
```

Boosts influence discovery.

Boosts do not grant reputation.

Boosts do not grant governance.

Boosts do not grant moderation power.

---

## Conduct Signal Relationship

Future Passport identity surfaces may display a Conduct Signal.

Planned signals:

* Green
* Orange
* Red
* Black

Green means friendly or casual.

Orange means serious but respectful.

Red means high-intensity or PvP-heavy.

Black means Passport downed due to moderation.

Conduct Signal is separate from reputation and membership.

---

## Black Passport

Black Passport is a future moderation penalty state.

Public language:

```text
Passport downed. Respawning in...
```

During Black Signal status, the user temporarily falls back to NPC-equivalent benefits.

Possible restrictions:

* No boosts
* No squad slots
* No guild creation
* No badge claiming
* No prestige progress
* Restricted chat access
* No discovery influence

Black Signal should not permanently erase earned Passport history unless severe abuse requires badge review or revocation.

---

## Seasonal Progression

Future seasons may reset or archive seasonal progression.

Possible seasonal reset targets:

* XP
* Level
* Level progress
* Seasonal prestige progress
* Seasonal rankings

Seasonal resets should not erase:

* Identity
* Passport ownership
* Historical badges
* Lifetime achievement history
* Membership history
* Guild history
* Squad history

The player journey should continue even when seasons reset.

---

## Passport and Discovery

Passport data may influence discovery.

Possible discovery inputs from Passport:

* Reputation
* Badge points
* Boost activity
* Conduct status
* Prestige progress
* Guild participation
* Squad relationships

Discovery should not be controlled by Passport level alone.

Discovery should balance quality, trust, activity, and community momentum.

---

## Passport and Customization

Passport may eventually display customization.

Future Passport customization may include:

* Passport themes
* Passport frames
* Badge display layouts
* Conduct signal styling
* Reputation title display
* Prestige effects
* Seasonal effects

Most equipped customization should remain off-chain.

On-chain should store unlock proofs for meaningful or rare items.

---

## Passport and Recovery

Passport is a valuable long-term identity asset.

Recovery should help users regain access to their Passport without compromising security.

Future recovery may use:

* zkLogin recovery
* Linked social recovery
* Linked game account recovery
* Optional email recovery
* Squad support
* Guild support
* Manual review

Recovery should preserve Passport history whenever possible.

---

## Current Move Module

Current module:

```move
module nami::passport
```

Current source file:

```text
contracts/nami/sources/passport.move
```

Technical schema is documented separately in:

```text
docs/passport-object.md
```

---

## Current Core Functions

Current Passport logic supports:

* Passport creation
* XP application
* Badge point application
* Curved level progression
* Reputation updates
* Tier upgrade state
* Safe read getters
* Progression events

Future modules should become authority gates for verification, membership, conduct, moderation, and seasonal resets.

---

## Core Principles

Passport should represent the player journey.

Passport progression should be earned.

Badge quality should matter.

Membership should control access, not reputation.

Conduct should communicate interaction state, not replace reputation.

Season resets should refresh progression without erasing identity.

Prestige should reward dedication beyond Level 100.

The Passport should feel alive, portable, and worth carrying across games.

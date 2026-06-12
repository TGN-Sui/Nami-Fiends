# Nami Passport Object

## Overview

The Passport object is the on-chain progression and access state for a Nami user.

Passport answers:

"What has this player done, what have they earned, and what access state are they currently in?"

Passport is connected to Identity but serves a different purpose.

Identity represents ownership.

Passport represents progression, reputation, membership state, badge scoring, and future prestige progress.

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

---

## Object Responsibility

Passport is responsible for storing:

* XP
* Level
* Level progress
* Badge points
* Reputation rank
* Gamer archetype
* Membership/access tier
* Boost score placeholder
* Prestige points
* Creation timestamp

Passport should not store:

* Chat messages
* Profile display name
* Avatar configuration
* Guild member lists
* Squad member lists
* Moderation evidence
* Appeal evidence
* Full badge metadata
* Wallet recovery secrets

---

## Passport Struct

Current structure:

```move
public struct Passport has key {
    id: UID,
    identity_id: address,
    xp: u64,
    level: u64,
    level_progress: u64,
    badge_points: u64,
    reputation: u8,
    archetype: u8,
    tier: u8,
    boost_score: u64,
    prestige_points: u64,
    created_at_ms: u64,
}
```

---

## Field Definitions

### id

Type:

```move
UID
```

Purpose:

Unique Sui object identifier for the Passport.

This is the Passport object identity.

---

### identity_id

Type:

```move
address
```

Purpose:

Links the Passport to a Nami Identity object.

This creates the relationship:

```text
Identity → Passport
```

The Passport should be treated as the progression companion to the Identity.

---

### xp

Type:

```move
u64
```

Purpose:

Total XP earned during the current progression cycle or season.

XP is currently earned through badge points.

Current badge XP model:

* Basic Badge = 1 XP
* Event Badge = 2 XP
* Completion Badge = 3 XP

XP contributes to level progression.

---

### level

Type:

```move
u64
```

Purpose:

Current Passport level.

Current starting level:

```text
Level 1
```

Current max level:

```text
Level 100
```

Level progression uses a curved XP requirement system.

Higher levels require more XP than lower levels.

---

### level_progress

Type:

```move
u64
```

Purpose:

Tracks XP progress toward the next level.

This prevents the system from using a simple linear formula like:

```text
xp / 100 + 1
```

Instead, XP is accumulated toward the next level requirement.

When level_progress reaches the required XP for the current level, the Passport levels up and remaining progress carries forward.

---

### badge_points

Type:

```move
u64
```

Purpose:

Tracks the total quality score earned from badges.

Badge points are different from badge count.

A user with fewer high-quality badges may have more badge points than a user with many low-quality badges.

Current model:

* Basic Badge = 1 point
* Event Badge = 2 points
* Completion Badge = 3 points

Badge points feed XP and reputation progression.

---

### reputation

Type:

```move
u8
```

Purpose:

Stores the current reputation rank.

Current reputation values:

```text
0 = Newbie
1 = Gamester
2 = Goblin
3 = Goonie
4 = Fiend
```

Reputation is earned through progression and badge quality.

Membership tier does not affect reputation.

Reputation cannot be purchased.

---

### archetype

Type:

```move
u8
```

Purpose:

Stores the onboarding gamer archetype selected by the user.

Archetype represents identity flavor, not access power.

Example archetypes may include:

* Explorer
* Competitor
* Collector
* Social Gamer
* Creator
* Wildcard

Archetype is not currently used for permissions.

---

### tier

Type:

```move
u8
```

Purpose:

Stores the current membership/access tier.

Current membership values:

```text
0 = NPC
1 = Adventurer
2 = Pro
3 = Elite
```

NPC is the default tier.

Membership controls access.

Membership does not affect reputation.

Membership does not override moderation.

---

### boost_score

Type:

```move
u64
```

Purpose:

Reserved for future discovery and influence systems.

This may later track received boosts, channel influence, or contribution to discovery cycles.

Current status:

```text
Reserved / placeholder
```

---

### prestige_points

Type:

```move
u64
```

Purpose:

Tracks progress earned after reaching Level 100.

Once a Passport reaches max level, additional XP contributes to prestige_points.

Prestige points may later unlock:

* Prestige titles
* Prestige frames
* Passport effects
* Seasonal cosmetics
* Rare badge effects
* Puzzle pieces
* Profile honors

Current status:

```text
Implemented as placeholder progression after Level 100
```

---

### created_at_ms

Type:

```move
u64
```

Purpose:

Timestamp of Passport creation in milliseconds.

Used for:

* Account age
* Historical records
* Future seasonal calculations
* Future eligibility checks

---

## Default Passport State

When created, a Passport starts with:

```text
xp = 0
level = 1
level_progress = 0
badge_points = 0
reputation = Newbie
tier = NPC
boost_score = 0
prestige_points = 0
```

The user also selects an archetype during onboarding.

---

## Membership Tier Model

Passport currently stores membership tier state.

Current access tiers:

```text
NPC → Adventurer → Pro → Elite
```

### NPC

Default free and unverified state.

NPC has no boost access.

---

### Adventurer

Verified human or basic membership state.

Adventurer has 1 boost power.

---

### Pro

Supporter/full-access tier.

Pro has 6 boost power.

---

### Elite

Premium supporter tier.

Elite has 8 boost power.

---

## Tier Upgrade Path

Current valid path:

```text
NPC → Adventurer → Pro → Elite
```

Invalid paths:

```text
NPC → Pro
NPC → Elite
Adventurer → Elite
Elite → Pro
Pro → Adventurer
```

Tier changes should only happen through controlled package-level functions.

Future modules should become the authority gates:

* verification.move
* membership.move

Passport should remain the state object.

---

## Reputation Model

Current reputation ranks:

```text
Newbie
Gamester
Goblin
Goonie
Fiend
```

Reputation is calculated from:

* Badge points
* Level progression

Current reputation should not be affected by:

* Membership tier
* Payment
* Conduct signal
* Channel ownership
* Guild ownership

---

## Curved Level Progression

Nami uses curved level progression.

The goal is to make early levels feel rewarding while slowing progression at higher levels.

Progression goals:

* Early levels should feel fast
* Higher levels should require dedication
* Level 100 should represent meaningful effort
* Level 100 should require roughly 3 months of high dedication
* Seasonal cycles may reset around 6 months
* Players who reach Level 100 early may earn Prestige progress

---

## Current Level Curve

The current level curve is implemented through:

```move
xp_required_for_next_level(level)
```

The current curve ranges roughly as follows:

```text
Level 1-9:   5-7 XP per level
Level 10-29: 7-11 XP per level
Level 30-59: 12-17 XP per level
Level 60-89: 18-25 XP per level
Level 90-99: 26-35 XP per level
```

This prevents a single badge from granting multiple high-level jumps.

Because badges currently provide only 1, 2, or 3 XP, progression remains controlled.

---

## Badge Integration

Badges call Passport through:

```move
passport::apply_badge_points(...)
```

This function:

* Adds badge points
* Adds XP
* Updates level progress
* Updates reputation
* Emits BadgePointsAdded

Badges are the current source of progression.

---

## Boost Integration

Boost reads Passport tier through:

```move
passport::get_tier(...)
```

Boost does not directly access Passport fields.

This preserves module ownership boundaries.

Boost power is based on tier:

```text
NPC = blocked
Adventurer = 1
Pro = 6
Elite = 8
```

---

## Events

Current Passport events:

* PassportCreated
* XPAdded
* BadgePointsAdded
* TierUpgraded

---

## PassportCreated

Emitted when a Passport is created.

Fields:

* passport_id
* identity_id

---

## XPAdded

Emitted when XP is added.

Fields:

* passport_id
* amount
* total_xp
* level
* level_progress

---

## BadgePointsAdded

Emitted when badge points are added.

Fields:

* passport_id
* amount
* total
* reputation

---

## TierUpgraded

Emitted when membership tier changes.

Fields:

* passport_id
* old_tier
* new_tier

---

## Current Public Getters

Current read functions:

```move
get_tier(passport)
get_level(passport)
get_reputation(passport)
get_badge_points(passport)
get_xp(passport)
get_level_progress(passport)
get_prestige_points(passport)
```

These exist so other modules can safely read Passport state without directly accessing private struct fields.

---

## Access Control Notes

Passport fields are private to the passport module.

Other modules should not directly mutate Passport state.

Mutation should happen through controlled functions.

Current package-level mutation functions include:

* add_xp
* apply_badge_points
* verify_to_adventurer
* upgrade_to_pro
* upgrade_to_elite

Future authority modules should call these functions.

External users should not directly self-award XP, badge points, or membership upgrades.

---

## Future Membership Expiration

Future Passport or Membership objects may add:

* tier_expires_at_ms
* renewed_at_ms
* grace_period_until_ms
* previous_tier
* effective_tier

Future membership expiration rules:

* Expired Pro or Elite loses active benefits
* Verified users may fall back to Adventurer
* Unverified users may fall back to NPC
* Expiration should not delete reputation or badge history

---

## Future Conduct Integration

Conduct should remain separate from Passport reputation and membership.

Future conduct state may include:

* Green Signal
* Orange Signal
* Red Signal
* Black Signal

Black Signal may temporarily force NPC-equivalent benefits.

This should be implemented carefully to avoid permanently overwriting the user's actual membership tier.

A future effective access check may need to consider:

```text
membership tier + conduct status + expiration
```

---

## Future Season Reset

Future seasonal resets may reset or archive:

* XP
* Level
* Level progress
* Seasonal prestige progress

Seasonal resets should not delete:

* Identity
* Passport object
* Historical badges
* Lifetime reputation history
* Membership history
* Guild history
* Squad history

---

## Future Prestige System

Prestige will define post-Level-100 progression.

Potential future fields:

* prestige_level
* prestige_title
* prestige_season_id
* lifetime_prestige_points

Prestige should reward highly dedicated players without making new players feel permanently locked out.

---

## Future Object Evolution

Possible future options:

1. Keep Passport as a single core object.
2. Split seasonal progression into a separate SeasonPassport object.
3. Split membership into a Membership object.
4. Split conduct into a ConductStatus object.
5. Split customization into off-chain profile settings with on-chain unlock proofs.

The current Passport object should remain minimal enough to support future migration.

---

## Core Principle

Passport is the player's on-chain journey.

It should track meaningful progression and access state without becoming overloaded with chat, evidence, profile cosmetics, or social graph data.

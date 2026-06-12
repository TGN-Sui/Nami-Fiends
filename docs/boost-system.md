# Nami Boost System

## Overview

The Nami Boost System allows eligible members to support channels, games, guilds, events, and communities during recurring discovery cycles.

Boosts are community discovery signals.

Boosts are not governance rights.

Boosts do not grant ownership, moderation power, badge authority, or reputation.

---

## Core Purpose

Boosts help answer:

"What should the Nami community discover this cycle?"

Boosts are designed to:

* Surface active communities
* Help quality channels gain visibility
* Encourage weekly discovery cycles
* Let verified and supporting members influence visibility
* Prevent permanent dominance by any one community

---

## Current Move Module

Current module:

```move
module nami::boost
```

Current source file:

```text
contracts/nami/sources/boost.move
```

---

## Current Boost Model

Boost power is based on active Passport membership tier.

Current model:

```text
NPC = no boost access
Adventurer = 1 boost power
Pro = 6 boost power
Elite = 8 boost power
```

NPC users cannot boost.

Black Passport users should not be able to boost in future moderation-aware access checks.

---

## Membership Relationship

Boost access depends on Membership Tier.

Membership tiers:

* NPC
* Adventurer
* Pro
* Elite

Membership controls boost access.

Reputation does not directly grant boosts.

Conduct penalties may disable boosts.

---

## NPC

NPC is the default free and unverified tier.

NPC users have no boost access.

Reason:

* Reduce bot influence
* Reduce sybil attacks
* Prevent unverified discovery manipulation
* Encourage human verification before influence

---

## Adventurer

Adventurer represents verified human/basic access.

Current boost power:

```text
1
```

Purpose:

* Allow verified humans to participate in discovery
* Give basic verified users a voice
* Keep discovery influence limited at entry level

---

## Pro

Pro represents full-access supporter membership.

Current boost power:

```text
6
```

Purpose:

* Give stronger supporters meaningful discovery influence
* Encourage participation in weekly discovery cycles
* Support community growth without overpowering the system

---

## Elite

Elite represents premium supporter membership.

Current boost power:

```text
8
```

Purpose:

* Give premium supporters deeper discovery influence
* Keep influence capped below excessive levels
* Preserve fairness while rewarding strong supporters

Elite does not override moderation or access rules.

---

## Black Passport Restriction

If a user has Black Passport status, boosts should be disabled regardless of membership tier.

Black Passport means:

```text
Passport downed. Respawning in...
```

During Black status, the user temporarily falls back to NPC-equivalent benefits.

Boost access must be disabled.

Future access checks should consider:

```text
effective_tier = membership tier + conduct status + expiration
```

---

## Weekly Boost Cycles

Boosts are intended to reset weekly.

Weekly cycles help:

* Refresh discovery
* Prevent permanent channel dominance
* Encourage regular participation
* Give smaller communities recurring opportunities
* Create rhythm for community engagement

Future cycle fields may include:

* week_id
* cycle_start_ms
* cycle_end_ms
* reset_at_ms

---

## No Rollover Rule

Boosts should not roll over between cycles.

Reason:

* Prevent hoarding
* Encourage active weekly participation
* Keep discovery fresh
* Avoid sudden manipulation by stored boosts

Unused boosts expire at the end of the cycle.

---

## Per-Channel Boost Limits

Future versions should limit how many times one member can boost the same channel per cycle.

Planned rule:

```text
Each channel can be boosted up to 3 times per member per cycle.
```

Purpose:

* Prevent one user from overly concentrating influence
* Encourage broader discovery
* Allow members to support multiple communities

---

## Boost Objects

Current Boost object fields:

```move
public struct Boost has key {
    id: UID,
    owner: address,
    channel_id: address,
    power: u8,
    week_id: u64,
}
```

---

## Field Definitions

### owner

The user who used the boost.

---

### channel_id

The channel, hub, game, guild, or community target being boosted.

Current implementation uses address placeholder format.

Future versions may use dedicated Channel or Hub object IDs.

---

### power

Boost strength derived from membership tier.

Power is not user-selected.

Power must be resolved by protocol logic.

---

### week_id

The discovery cycle identifier.

Current implementation stores this field for future weekly reset logic.

---

## Boost Events

Current event:

```move
BoostUsed
```

Fields:

* owner
* channel_id
* power
* tier
* week_id

Purpose:

* Track boost usage
* Support indexers
* Feed discovery engine
* Support anti-abuse analytics

---

## Discovery Relationship

Boosts are one input into discovery.

Discovery may also use:

* Channel activity
* Badge quality
* Reputation signals
* Conduct health
* Guild activity
* Squad activity
* Developer verification
* Engagement quality
* Moderation health

Boosts should influence discovery, not fully control it.

---

## Anti-Abuse Rules

Future boost systems must resist:

* Bot boosting
* Sybil boosting
* Boost farms
* Paid manipulation
* Collusion between channels and members
* Excessive Elite concentration
* Boost hoarding

Potential protections:

* NPC boost restriction
* Verification requirements
* Weekly resets
* No rollover
* Per-channel caps
* Per-member caps
* Conduct restrictions
* Expiration checks
* Anti-collusion scoring

---

## Boost and Reputation

Boosts should not directly increase user reputation.

Boosting a channel does not make the booster more reputable.

Boosts may contribute to channel discovery, but not player reputation.

---

## Boost and Badges

Boosting alone should not issue badges.

A channel may later reward participation, but simple boosting should not create badge points.

This prevents pay-to-reputation behavior.

---

## Boost and Membership Expiration

When Pro or Elite membership expires:

* Boost access should be recalculated
* Unused boosts should expire or become inactive
* Future boost cycles should use the user's effective tier
* Expired users should not retain Pro or Elite boost power

If still verified, the user may fall back to Adventurer.

If not verified, the user may fall back to NPC.

---

## Boost and Channel Access

Boosting a channel does not grant chat permission.

A user may boost a public channel without gaining access to restricted chat areas unless channel rules allow it.

Channel access may depend on:

* Membership tier
* Reputation rank
* Badge ownership
* Guild membership
* Squad sponsorship
* Conduct status
* Channel owner rules

---

## Future Boost Authority

Current boost logic reads tier from Passport.

Future modules may include:

* boost_cycle.move
* boost_registry.move
* boost_limits.move
* discovery_signal.move

These modules may enforce:

* Weekly allowances
* Per-channel limits
* No rollover
* Conduct restrictions
* Membership expiration
* Channel eligibility

---

## Future Backend Indexing

The backend discovery engine should index BoostUsed events.

Indexed boost data may include:

* week_id
* channel_id
* total boost power
* unique boosters
* booster tier distribution
* suspicious boost patterns
* cycle rankings

---

## Core Principles

Boosts should create weekly discovery momentum.

Boosts should reward active supporters without becoming pay-to-win.

Boosts should be capped, reset, and protected from abuse.

Boosts are visibility signals, not ownership rights.

# Nami Membership System

## Overview

The Nami Membership System controls access to protocol features, benefits, and supporter capabilities.

Membership is separate from Reputation.

Membership is separate from Conduct Signal.

Membership is separate from Gamer Archetype.

Membership answers:

"What features can this user access?"

Reputation answers:

"What has this user earned?"

Conduct Signal answers:

"What kind of interaction should others expect from this user?"

---

## Core Membership Tiers

Nami currently defines four membership tiers:

* NPC
* Adventurer
* Pro
* Elite

These tiers are used for access control, boost eligibility, future squad slots, customization capacity, and premium protocol features.

---

# NPC

## Description

NPC is the default free and unverified state.

Every new Passport begins as NPC.

NPC users are not verified humans and do not receive membership benefits.

---

## NPC Permissions

NPC users may:

* Create an Identity
* Own a Passport
* Select an onboarding archetype
* View public spaces
* Participate in channels that allow NPC chat
* Build limited profile history where allowed

---

## NPC Restrictions

NPC users may not:

* Use boosts
* Create guilds
* Sponsor squad members
* Serve on juries
* Issue badges
* Access verified-only channels
* Access Pro or Elite features
* Influence discovery
* Claim premium rewards

---

## NPC Purpose

NPC exists to allow easy onboarding while limiting spam, bots, and abuse.

NPC is a sandbox state.

Users may explore Nami before becoming verified.

---

# Adventurer

## Description

Adventurer is the verified human / basic access tier.

A user may become Adventurer through approved verification or basic membership.

---

## Adventurer Requirements

Possible Adventurer paths:

* Nami human verification
* X.com verification carryover
* zkLogin-linked verification
* Future SuiNS verification
* Future Steam or Epic account verification
* Future approved identity provider

---

## Adventurer Benefits

Adventurer users may:

* Access verified user features
* Use 2 boost per cycle
* Access Adventurer+ channels
* Claim eligible basic rewards
* Display verified human status
* Participate in broader community systems

---

## Adventurer Restrictions

Adventurer users may not:

* Sponsor squad members by default
* Create guilds by default
* Serve on anonymous juries by default
* Issue official badges without approval
* Access Pro or Elite feature capacity

---

# Pro

## Description

Pro is the full-access supporter tier.

Pro users support the protocol and gain expanded access.

Pro should increase feature access without purchasing reputation.

---

## Pro Benefits

Pro users may:

* Use 6 boosts per cycle
* Access Pro features
* Access expanded customization capacity
* Become eligible for limited squad sponsorship slots
* Become eligible for anonymous jury pools
* Participate in higher-trust community systems

---

## Pro Restrictions

Pro users may not:

* Purchase reputation
* Bypass moderation
* Issue badges without issuer approval
* Override channel rules
* Skip conduct penalties

---

# Elite

## Description

Elite is the premium supporter tier.

Elite users receive the highest membership access and cosmetic capacity.

Elite should feel premium without becoming pay-to-win.

---

## Elite Benefits

Elite users may:

* Use 8 boosts per cycle
* Access premium customization systems
* Access expanded squad sponsorship slots
* Become eligible for anonymous jury pools
* Display premium cosmetics
* Participate in premium community features

---

## Elite Restrictions

Elite users may not:

* Purchase reputation
* Avoid Black Passport restrictions
* Override moderation actions
* Automatically gain badge issuer authority
* Control discovery alone
* Bypass guild, squad, or channel requirements

Elite grants access, not immunity.

---

# Boost Access

Boost access is based on active membership tier.

Current model:

* NPC: 0 boosts
* Adventurer: 1 boost
* Pro: 6 boosts
* Elite: 8 boosts

Boosts are discovery signals.

Boosts are not governance rights.

Boosts do not grant ownership, moderation, or badge authority.

---

# Membership and Reputation

Membership and Reputation must remain separate.

A user may be:

* NPC with high reputation
* Adventurer with low reputation
* Pro with low reputation
* Elite with high reputation
* Elite with Black Signal

Reputation is earned.

Membership controls access.

Membership should never directly increase reputation.

---

# Membership and Conduct Signal

Conduct penalties override membership benefits.

If a user has Black Signal:

* Boosts are disabled
* Squad slots are disabled
* Guild creation is disabled
* Badge claiming may be paused
* Prestige progress may be paused
* Verified gated access may be restricted

A Black Passport temporarily falls back to NPC-equivalent benefits until respawn.

---

# Membership Expiration

Future versions will support membership expiration.

Expiration is important because Pro and Elite benefits should not remain active forever without renewal.

Planned fields may include:

* tier
* expires_at_ms
* renewed_at_ms
* grace_period_until_ms
* previous_tier

---

## Expiration Rules

When a paid membership expires:

* Pro benefits are disabled
* Elite benefits are disabled
* Boost access is recalculated
* Squad slots may expire or become inactive
* Premium customization capacity may be restricted
* Jury eligibility is removed

If the user remains verified, they may fall back to Adventurer.

If the user is no longer verified, they may fall back to NPC.

---

## Renewal Rules

Renewal should restore access according to the renewed tier.

Renewal should not reset:

* Passport history
* Reputation
* Badges
* XP
* Level
* Archetype
* Guild history
* Squad history

Renewal restores access, not earned reputation.

---

# Grace Periods

Nami may support short grace periods for expired memberships.

Grace periods may allow:

* Temporary display retention
* Renewal reminders
* Cosmetic unequip delay
* Squad slot transition delay

Grace periods should not allow discovery abuse or boost carryover.

Boost access should end immediately or at the end of the active cycle depending on final policy.

---

# Membership Upgrade Path

The intended membership path is:

NPC → Adventurer → Pro → Elite

Users should not skip required verification paths unless approved by protocol rules.

NPC to Adventurer should require verification.

Pro and Elite should require active membership status.

---

# Membership Authority

Passport stores membership tier state.

Future authority modules should control tier changes.

Planned modules:

* verification.move
* membership.move

Verification should control:

* NPC to Adventurer

Membership should control:

* Adventurer to Pro
* Pro to Elite
* Expiration
* Renewal
* Effective tier checks

Passport should remain the state object.

Verification and Membership modules should become the permission gates.

---

# Future Events

Membership-related events may include:

* TierUpgraded
* MembershipRenewed
* MembershipExpired
* MembershipGracePeriodStarted
* MembershipDowngraded
* EffectiveTierUpdated

---

# Core Principles

Access can be purchased.

Reputation must be earned.

Membership should improve experience, not create unfair social power.

Membership must never override moderation.

Membership must remain understandable to gamers.

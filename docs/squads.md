# Nami Squads

## Purpose

Squads are small gamer-native trust and sponsorship groups.

They are designed for close social circles, trusted teammates, and lightweight sponsorship relationships.

Squads are not guilds.

Squads answer:

```text
Who does this player personally sponsor or trust?
```

---

## Current Status

Current module:

```move
module nami::squad
```

Current protocol status:

```text
33 tests passing
0 warnings
```

Squads are currently integrated with:

```text
Passport
Membership
Conduct
Admin-controlled membership upgrades
```

---

# Core Concept

A Squad is a small group created by a Pro or Elite member.

The Squad owner can sponsor other users into the Squad until the Squad reaches its slot limit.

Current slot model:

```text
Pro   = 3 squad slots
Elite = 8 squad slots
```

---

# Current Objects

## Squad

The `Squad` object represents the group.

It currently stores:

* Owner
* Owner Passport ID
* Name
* Max slots
* Member count
* Creation timestamp

---

## SquadMember

The `SquadMember` object represents a sponsored membership proof.

It currently stores:

* Squad ID
* Sponsor
* Member
* Creation timestamp

---

# Squad Creation

Current requirements:

```text
Pro or Elite effective tier
No active Black Passport
```

NPC users cannot create Squads.

Adventurer users cannot create Squads.

Black Passport users cannot create Squads, even if their raw tier is Pro or Elite.

---

# Sponsorship

Squad owners can sponsor members.

Current sponsorship rules:

* Sender must own the Squad
* Sponsor must still meet Squad benefit requirements
* Squad must have available slots
* Sponsored user receives a SquadMember proof object

Sponsorship is a trust signal.

It is not full verification.

It is not membership.

It is not reputation.

---

# Conduct Integration

Squads use conduct-aware access checks.

If a Squad owner has active Black Passport status:

```text
Effective tier = NPC-equivalent
```

This blocks:

* Squad creation
* Squad sponsorship
* Squad benefit usage

Black Passport does not delete the Squad by default.

Future versions may define how inactive or restricted Squad ownership should be displayed.

---

# Membership Integration

Squad access is tied to effective membership tier.

Current eligibility:

```text
Pro   = Can create Squad with 3 slots
Elite = Can create Squad with 8 slots
```

Future membership expiration should affect Squad benefits.

Example future behavior:

```text
Expired Pro/Elite → Squad benefits paused
```

Passport history and existing Squad records should not be silently deleted.

---

# Current Events

Squads currently emit:

```text
SquadCreated
SquadMemberSponsored
```

Event field details are documented in:

```text
docs/events.md
```

---

# Current Test Coverage

Current tests verify:

* Pro member can create a Squad
* NPC cannot create a Squad
* Squad owner can sponsor a member
* Squad member receives a SquadMember proof
* Squad member count increases
* Slot model is applied correctly for Pro

---

# System Boundaries

## Squads Are Not Guilds

Squads are small trust networks.

Guilds will be larger persistent communities with roles, channels, events, and possibly badge permissions.

---

## Squads Are Not Verification

Being sponsored into a Squad should not automatically make a user Adventurer, Pro, or Elite.

Squad sponsorship may later become one signal in trust or recovery systems, but it should not replace verification.

---

## Squads Are Not Reputation

Squad membership should not directly grant reputation.

Reputation must still be earned through meaningful activity.

---

## Squads Are Not Boost Multipliers

Squad membership should not automatically grant extra boosts.

Boost access should remain controlled by Membership, Conduct, and future boost-cycle rules.

---

# Future Work

Planned Squad improvements:

```text
Squad display on Passport profiles
Squad member removal
Squad ownership transfer
Squad slot updates when membership expires
Elite expanded Squad utilities
Squad recovery support
Squad trust scoring
Squad invitation flow
Squad cooldowns
Anti-abuse checks
```

Possible future recovery use:

```text
Squad support may help verify identity recovery claims.
```

This must be handled carefully to prevent social engineering or account takeover.

---

# Related Docs

```text
docs/access-control.md
docs/membership.md
docs/conduct-system.md
docs/trust-system.md
docs/events.md
docs/guilds.md
```

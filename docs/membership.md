# Nami Membership

## Purpose

Membership controls feature access and platform benefits.

Membership is separate from:

* Reputation
* Verification
* Conduct
* Badge history
* Archetype
* Guild role
* Squad membership

Membership answers:

```text
What benefits can this user access?
```

Reputation answers:

```text
What has this user earned?
```

---

## Current Status

Current module:

```move
module nami::membership
```

Current related modules:

```text
passport.move
verification.move
conduct.move
boost.move
channel_access.move
squad.move
jury.move
admin.move
```

Current protocol status:

```text
33 tests passing
0 warnings
```

---

# Membership Tiers

Current tiers:

```text
0 = NPC
1 = Adventurer
2 = Pro
3 = Elite
```

---

## NPC

NPC is the default tier for every new Passport.

NPC means:

* Free user
* Unverified or limited access
* No boost access
* No Squad creation
* No Jury eligibility
* Channel chat depends on channel policy

NPC is not a punishment state.

NPC is the starting state.

---

## Adventurer

Adventurer represents verified-human or basic trusted access.

Current unlock path:

```text
NPC → Adventurer
```

This transition is controlled by:

```move
module nami::verification
```

Current Adventurer benefit:

```text
1 boost
```

Adventurer users may chat in channels that require Adventurer+ access.

---

## Pro

Pro is a higher access tier.

Current unlock path:

```text
Adventurer → Pro
```

This transition is currently controlled through AdminCap.

Current Pro benefits:

```text
6 boosts
Squad creation
3 squad slots
Jury eligibility
```

---

## Elite

Elite is the highest current membership tier.

Current unlock path:

```text
Pro → Elite
```

This transition is currently controlled through AdminCap.

Current Elite benefits:

```text
8 boosts
Squad creation
8 squad slots
Jury eligibility
```

Elite does not override moderation.

---

# Effective Tier

Nami uses effective tier checks instead of relying only on raw Passport tier.

Current effective tier considers:

```text
Passport tier
+ Conduct status
```

When Conduct is Black:

```text
Effective tier = NPC-equivalent
```

This prevents restricted users from using premium benefits while their Passport is downed.

---

# Black Passport Effect

Black Passport means:

```text
Passport downed. Respawning in...
```

While Black Passport is active, the user temporarily loses active benefits.

Current affected systems:

* Boosts
* Channel chat
* Squad creation
* Squad sponsorship
* Jury eligibility
* Premium benefit access

Black Passport should not erase membership history, reputation, badges, or Passport ownership by default.

---

# Current Access Summary

```text
Feature                     NPC   Adventurer   Pro   Elite   Black
Boost                       No    1            6     8       No
Create Squad                No    No           Yes   Yes     No
Squad Slots                 0     0            3     8       0 active
Jury Eligibility            No    No           Yes   Yes     No
Chat if NPC Allowed         Yes   Yes          Yes   Yes     No
Chat if NPC Disabled        No    Yes          Yes   Yes     No
```

Channel mutes and channel bans can still block chat regardless of tier.

---

# Verification Relationship

Verification controls the first trusted transition:

```text
NPC → Adventurer
```

Verification does not grant reputation.

Verification does not automatically grant Pro or Elite.

Verification proves enough authenticity to unlock basic trusted access.

---

# Reputation Relationship

Membership does not create reputation.

A paid member can still have low reputation.

A high-reputation user can still be NPC if they are not verified or not actively subscribed.

A Pro or Elite user can still be restricted by moderation.

---

# Admin Authority

Current Pro and Elite upgrades are exposed through:

```move
module nami::admin
```

AdminCap currently controls:

* Upgrade to Pro
* Upgrade to Elite

This is the MVP authority model.

Future versions should replace this with subscription-aware membership logic.

---

# Future Expiration and Renewal

Membership expiration is planned.

Future membership should support:

```text
Expiration timestamp
Renewal status
Grace period
Downgrade rules
Membership history
Subscription proof
```

Possible future behavior:

```text
Expired Elite → fallback to Adventurer if still verified
Expired Pro → fallback to Adventurer if still verified
Expired verified status → fallback to NPC
```

Expiration should not delete:

* Identity
* Passport
* Badge history
* Reputation history
* Appeal history
* Squad history

---

# Future Membership Records

A future `MembershipRecord` object may track:

* Owner
* Passport ID
* Tier
* Started timestamp
* Expiration timestamp
* Renewal timestamp
* Payment/subscription reference
* Active status

This would make membership history easier to index and audit.

---

# Design Rules

Membership controls access.

Membership does not buy reputation.

Membership does not bypass moderation.

Membership benefits should use effective tier checks.

Black Passport overrides active benefits while restricted.

Expiration should pause benefits without erasing history.

---

# Related Docs

```text
docs/access-control.md
docs/passport.md
docs/verification.md
docs/conduct-system.md
docs/moderation.md
docs/squads.md
docs/jury.md
docs/admin.md
```

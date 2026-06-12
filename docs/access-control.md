# Nami Access Control

## Purpose

Access Control defines who can use Nami features and under what conditions.

Nami access is not based on one value.

Access is calculated from multiple protocol signals:

```text
Identity
Passport
Verification
Membership
Conduct
Moderation
Channel Policy
Badge Authority
Admin Authority
Squad Eligibility
Jury Eligibility
```

This prevents a user from bypassing restrictions just because they have a high membership tier.

---

## Current Status

Current Move status:

```text
33 tests passing
0 warnings
```

Current access-related modules:

```text
verification.move
membership.move
channel_access.move
conduct.move
moderation.move
admin.move
badge_issuer.move
jury.move
squad.move
```

---

# Access Layers

## Identity Ownership

Identity proves ownership of a Nami presence.

Used by:

* Verification
* Future recovery
* Future linked accounts
* Future developer identity

Identity does not grant reputation or premium benefits by itself.

---

## Passport State

Passport stores the player journey and current tier state.

Current default:

```text
New Passport = NPC
```

Passport tier is stored on-chain, but most systems should use effective access checks instead of trusting raw tier alone.

---

## Verification Access

Verification controls:

```text
NPC → Adventurer
```

Current verification requires:

* Sender owns the Identity
* Passport is linked to the Identity
* Verification source is supported

Verification does not grant reputation.

---

## Membership Access

Current membership tiers:

```text
0 = NPC
1 = Adventurer
2 = Pro
3 = Elite
```

Membership controls feature access, not earned reputation.

Current benefit examples:

```text
NPC         = limited access
Adventurer  = 1 boost
Pro         = 6 boosts, squad access, jury eligibility
Elite       = 8 boosts, larger squad access, jury eligibility
```

Future membership work should add:

* Expiration
* Renewal
* Grace periods
* Subscription records
* Downgrade handling

---

# Effective Tier

Raw Passport tier should not be treated as final access.

Current effective tier may consider:

```text
Passport tier
+ Conduct status
```

Black Passport forces effective tier to:

```text
NPC-equivalent
```

Even if the raw Passport tier is Pro or Elite.

This currently affects:

* Boost access
* Channel chat
* Squad creation
* Jury eligibility

Future effective tier may also include:

* Membership expiration
* Renewal status
* Verification status
* Recovery status
* Emergency restrictions

---

# Conduct Access

Conduct Signals:

```text
Green
Orange
Red
Black
```

Green, Orange, and Red are public interaction signals.

Black is a restriction state.

Black Passport means:

```text
Passport downed. Respawning in...
```

While Black is active:

* Boosts are blocked
* Channel chat is blocked
* Squad benefits are blocked
* Jury eligibility is blocked
* Premium benefits fall back to NPC-equivalent restrictions

Black does not erase earned Passport history by default.

---

# Channel Access

Channel access is controlled by `ChannelAccessPolicy`.

Current channel rules:

```text
Allow NPC Chat
Minimum Tier
Minimum Reputation
```

Current channel chat can be blocked by:

* NPC chat disabled
* Minimum tier not met
* Minimum reputation not met
* Active Black Passport
* Active mute
* Active channel ban

Core channel toggle:

```text
Allow NPC Chat: Yes / No
```

This lets verified channels reduce spam without removing public discovery.

---

# Moderation Access

Moderation actions can restrict access.

Current actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

Current effects:

```text
Warning          = record only
Mute             = blocks chat for matching channel
Channel Ban      = blocks chat for matching channel
Black Passport   = global benefit restriction through Conduct
```

Moderation records are used by channel access checks.

---

# Admin Authority

`AdminCap` controls sensitive MVP actions.

Current AdminCap permissions:

```text
Approve badge issuers
Upgrade to Pro
Upgrade to Elite
Issue warning
Issue mute
Issue channel ban
Issue Black Passport
Resolve appeals
Open jury cases
Close jury cases
```

AdminCap is the current MVP authority model.

It should later evolve into more granular authority:

* Platform admins
* Channel moderators
* Guild moderators
* Developer owners
* Emergency controls
* Multi-admin controls

---

# Badge Issuer Access

Badge minting is separated from badge authority.

`badge.move` handles badge creation.

`badge_issuer.move` controls who can issue badge types.

Current issuer permissions:

```text
Can issue Basic Badge
Can issue Event Badge
Can issue Completion Badge
```

Completion Badge access must be explicitly granted.

Starting a game, opening a game, or joining a channel should not issue a Completion Badge.

---

# Boost Access

Current boost access:

```text
NPC         = blocked
Adventurer  = 1
Pro         = 6
Elite       = 8
```

Boosts use effective tier.

A Black Passport user cannot boost, even if their raw tier is Pro or Elite.

Boosts are discovery signals only.

They are not governance, ownership, moderation power, or reputation.

---

# Jury Access

Jury eligibility currently requires:

```text
Pro or Elite effective tier
No active Black Passport
```

Jury participation is advisory.

Current jury votes:

```text
Approved
Denied
Modified
```

Future jury access may also require:

* Minimum reputation
* No recent severe moderation history
* No conflict of interest
* Active membership
* Juror cooldowns

---

# Squad Access

Squads are limited to Pro and Elite users.

Current slot model:

```text
Pro   = 3 squad slots
Elite = 8 squad slots
```

NPC and Adventurer users cannot create squads.

Black Passport blocks squad benefits through effective tier.

Squad owners can sponsor members until their slot limit is reached.

---

# Appeals Access

Users may open an appeal for their own moderation record.

Appeal opening requires:

* The moderation record targets the sender
* The record belongs to the sender’s Passport

Appeal resolution is currently AdminCap-controlled.

Private evidence should stay off-chain.

---

# Current Access Matrix

```text
Feature                         NPC   Adventurer   Pro   Elite   Black
Create Identity                 Yes   Yes          Yes   Yes     Yes
Create Passport                 Yes   Yes          Yes   Yes     Yes
Verify to Adventurer            Yes   N/A          N/A   N/A     Restricted by policy later
Use Boost                       No    Yes          Yes   Yes     No
Create Squad                    No    No           Yes   Yes     No
Sponsor Squad Member            No    No           Yes   Yes     No
Serve as Juror                  No    No           Yes   Yes     No
Chat if NPC allowed             Yes   Yes          Yes   Yes     No
Chat if NPC disabled            No    Yes          Yes   Yes     No
Chat while muted                No    No           No    No      No
Chat while channel banned       No    No           No    No      No
Issue Badges                    No    Cap only     Cap only Cap only No
Admin Actions                   Cap only
```

---

# Access Design Rules

Use effective tier for user-facing benefits.

Do not let raw Passport tier bypass Conduct.

Do not let payment grant reputation.

Do not let boosts become governance.

Do not let users self-assign restricted roles.

Do not store private evidence in access objects.

Keep authority paths explicit.

---

# Future Access Work

Planned future access systems:

```text
Membership expiration
Renewal checks
Guild-gated access
Badge-gated access
NFT-gated access
Developer-owned channel roles
Channel moderator roles
Guild moderator roles
Recovery restrictions
Emergency pause controls
```

---

# Related Docs

```text
docs/onchain.md
docs/systems.md
docs/membership.md
docs/conduct-system.md
docs/moderation.md
docs/squads.md
docs/jury.md
docs/admin.md
```

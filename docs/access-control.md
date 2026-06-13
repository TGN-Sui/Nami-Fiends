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
Admin Authority
Badge Issuer Authority
Jury Eligibility
Squad Eligibility
Guild Eligibility
Customization Access
Recovery Review
```

This prevents a user from bypassing restrictions just because they have a high membership tier.

---

## Current Status

Current Move status:

```text
55 tests passing
0 warnings
```

Current access-related modules:

```text
verification.move
membership.move
channel.move
channel_access.move
conduct.move
moderation.move
admin.move
badge_issuer.move
jury.move
squad.move
guild.move
profile.move
title.move
cosmetics.move
recovery.move
```

---

# Access Layers

## Identity Ownership

Identity proves ownership of a Nami presence.

Used by:

* Verification
* Recovery
* Future linked accounts
* Future developer identity

Identity does not grant reputation, membership benefits, or moderation authority by itself.

---

## Passport State

Passport stores the player journey and raw membership tier.

Default state:

```text
New Passport = NPC
```

Most systems should use effective access checks instead of trusting raw Passport tier alone.

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
NPC         = profile access, limited channel access
Adventurer  = channel creation, guild creation, 1 boost
Pro         = 6 boosts, squad access, jury eligibility
Elite       = 8 boosts, larger squad access, jury eligibility
```

Future membership work should add expiration, renewal, grace periods, and subscription records.

---

# Effective Tier

Raw Passport tier is not final access.

Current effective tier considers:

```text
Passport tier
+ Conduct status
```

Black Passport forces effective tier to:

```text
NPC-equivalent
```

Even if the raw Passport tier is Adventurer, Pro, or Elite.

This currently affects:

* Boost access
* Channel chat
* Squad creation
* Guild actions
* Jury eligibility
* Profile updates
* Title claiming and equipping
* Cosmetic equipping

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
* Guild actions are blocked
* Jury eligibility is blocked
* Profile updates are blocked
* Title claiming/equipping is blocked
* Cosmetic equipping is blocked
* Premium benefits fall back to NPC-equivalent restrictions

Black does not erase earned Passport history by default.

---

# Channel Access

Channels are real on-chain objects.

Related modules:

```text
channel.move
channel_access.move
```

Channel creation requires:

```text
Adventurer or higher effective tier
No active Black Passport
```

Channel access policies are now tied to real Channel ownership.

Current channel policy rules:

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

Verified Channels are currently approved through AdminCap.

---

# Profile Access

Profiles are public display anchors for Passports.

Related module:

```text
profile.move
```

Current rules:

```text
NPC may create Profile
Profile owner may update Profile
Black Passport blocks Profile updates
```

Profile media and long-form metadata should remain off-chain.

---

# Title Access

Titles are earned display proofs.

Related module:

```text
title.move
```

Current title access:

```text
Passport reputation → EarnedTitle → TitleDisplay
```

Users may claim reputation titles only when their Passport has enough reputation.

Black Passport blocks:

* Claiming titles
* Equipping titles

Titles do not grant membership, moderation authority, or reputation by themselves.

---

# Cosmetic Access

Cosmetics are display customization proofs.

Related module:

```text
cosmetics.move
```

Current cosmetic access:

```text
AdminCap grants CosmeticUnlock
User creates CosmeticLoadout
User equips owned CosmeticUnlock
```

Black Passport blocks cosmetic equipping.

Cosmetics do not grant reputation, verification, membership, or authority.

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
Grant cosmetic unlocks
Resolve recovery requests
Verify channels
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

```text
badge.move        = creates badges and applies points
badge_issuer.move = controls who may issue badge types
```

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

Future jury access may also require minimum reputation, no recent severe moderation history, no conflict of interest, active membership, and cooldowns.

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

# Guild Access

Guilds are larger community structures.

Current Guild creation requirements:

```text
Adventurer, Pro, or Elite effective tier
No active Black Passport
```

Current member limits:

```text
Adventurer = 25 members
Pro        = 100 members
Elite      = 250 members
```

Black Passport blocks Guild creation and Guild member management.

Guild history is not deleted by temporary restriction.

---

# Appeals Access

Users may open an appeal for their own moderation record.

Appeal opening requires:

* The moderation record targets the sender
* The record belongs to the sender’s Passport

Appeal resolution is currently AdminCap-controlled.

Private evidence should stay off-chain.

---

# Recovery Access

Recovery requests are formal account-safety records.

Current recovery flow:

```text
Identity + Passport → RecoveryRequest → Admin resolution
```

Current recovery does not transfer ownership automatically.

Recovery resolution is AdminCap-controlled.

Private recovery evidence should stay off-chain or encrypted.

---

# Current Access Matrix

```text
Feature                         NPC   Adventurer   Pro   Elite   Black
Create Identity                 Yes   Yes          Yes   Yes     Yes
Create Passport                 Yes   Yes          Yes   Yes     Yes
Create Profile                  Yes   Yes          Yes   Yes     No
Update Profile                  Yes   Yes          Yes   Yes     No
Verify to Adventurer            Yes   N/A          N/A   N/A     Restricted by policy later
Create Channel                  No    Yes          Yes   Yes     No
Verify Channel                  AdminCap only
Use Boost                       No    Yes          Yes   Yes     No
Create Guild                    No    Yes          Yes   Yes     No
Create Squad                    No    No           Yes   Yes     No
Sponsor Squad Member            No    No           Yes   Yes     No
Serve as Juror                  No    No           Yes   Yes     No
Claim Title                     Earned reputation required; blocked if Black
Equip Cosmetic                  Unlock required; blocked if Black
Chat if NPC allowed             Yes   Yes          Yes   Yes     No
Chat if NPC disabled            No    Yes          Yes   Yes     No
Chat while muted                No    No           No    No      No
Chat while channel banned       No    No           No    No      No
Issue Badges                    Cap only
Admin Actions                   Cap only
Open Recovery Request           Yes   Yes          Yes   Yes     Yes
Resolve Recovery Request        AdminCap only
```

---

# Access Design Rules

Use effective tier for user-facing benefits.

Do not let raw Passport tier bypass Conduct.

Do not let payment grant reputation.

Do not let boosts become governance.

Do not let cosmetics or titles become authority.

Do not let users self-assign restricted roles.

Do not store private evidence in access objects.

Keep authority paths explicit.

Do not automatically transfer recovery ownership until the security model is mature.

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
Multi-admin authority
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
docs/guilds.md
docs/customization.md
docs/recovery.md
docs/jury.md
docs/admin.md
```

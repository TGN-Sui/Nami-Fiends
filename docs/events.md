# Nami Events

## Purpose

Nami events make protocol activity indexable.

Objects store current state.

Events describe important state changes.

The backend, frontend, analytics tools, moderation dashboards, appeal flows, jury flows, discovery systems, and SDK integrations should use events to build user-facing timelines.

---

## Current Status

Current Move package:

```text
contracts/nami
```

Current protocol status:

```text
55 tests passing
0 warnings
```

Current event-producing modules:

```text
identity.move
passport.move
verification.move
badge.move
badge_issuer.move
boost.move
channel.move
channel_access.move
conduct.move
moderation.move
admin.move
appeals.move
jury.move
squad.move
guild.move
title.move
cosmetics.move
profile.move
recovery.move
```

---

# Event Rules

Events should be:

* Small
* Public-safe
* Indexable
* Useful to backend services
* Free of private evidence
* Free of raw personal identity data

Events should not include:

* Private chat logs
* Private moderation evidence
* Private appeal evidence
* Private recovery evidence
* Emails
* Real names
* Raw linked social account data
* Seed phrases
* Private game account IDs

---

# Identity and Passport Events

## IdentityCreated

Tracks Identity creation.

Core fields:

```text
identity_id
owner
```

---

## PassportCreated

Tracks Passport creation.

Core fields:

```text
passport_id
identity_id
```

---

## XPAdded

Tracks XP updates.

Core fields:

```text
passport_id
amount
```

---

## BadgePointsAdded

Tracks badge point updates.

Core fields:

```text
passport_id
amount
total
```

---

## TierUpgraded

Tracks membership tier changes.

Core fields:

```text
passport_id
old_tier
new_tier
```

---

# Verification Events

## IdentityVerified

Tracks successful verification.

Core fields:

```text
identity_id
passport_id
owner
source
verification_level
```

Used for:

```text
NPC → Adventurer
```

---

# Badge Events

## BadgeMinted

Tracks Badge object creation.

Core fields:

```text
owner
badge_type
points
```

---

## BadgeIssuerCreated

Tracks BadgeIssuerCap creation.

Core fields:

```text
owner
issuer_id
issuer_type
can_issue_basic
can_issue_event
can_issue_completion
```

---

## BadgeIssuedByIssuer

Tracks badge issuance through approved issuer authority.

Core fields:

```text
issuer_id
issuer_type
recipient
badge_type
```

---

# Boost Events

## BoostUsed

Tracks boost usage.

Core fields:

```text
owner
channel_id
power
tier
week_id
```

Boosts are discovery signals.

They are not reputation or governance.

---

# Channel Events

## ChannelCreated

Tracks Channel object creation.

Core fields:

```text
channel_id
owner
owner_passport_id
is_public
```

---

## ChannelUpdated

Tracks Channel metadata and visibility updates.

Core fields:

```text
channel_id
owner
is_public
```

---

## ChannelVerified

Tracks AdminCap channel verification.

Core fields:

```text
channel_id
owner
```

Verified channels may receive stronger trust and discovery treatment in frontend/backend systems.

---

# Channel Access Events

## ChannelAccessPolicyCreated

Tracks channel access policy creation.

Core fields:

```text
owner
channel_id
allow_npc_chat
minimum_tier
minimum_reputation
```

---

## ChannelAccessRuleUpdated

Tracks channel access policy updates.

Core fields:

```text
owner
channel_id
allow_npc_chat
minimum_tier
minimum_reputation
```

Channel access now supports a Channel-aware creation/update path tied to real Channel ownership.

---

# Conduct Events

## ConductStatusCreated

Tracks ConductStatus creation.

Core fields:

```text
owner
passport_id
signal
```

---

## ConductSignalUpdated

Tracks Conduct Signal changes.

Core fields:

```text
owner
passport_id
old_signal
new_signal
reason_code
expires_at_ms
```

---

## PassportDowned

Tracks Black Passport status.

Core fields:

```text
owner
passport_id
reason_code
respawn_at_ms
```

Public language:

```text
Passport downed. Respawning in...
```

---

## PassportRespawned

Tracks restoration from Black Passport status.

Core fields:

```text
owner
passport_id
restored_signal
```

---

# Moderation Events

## WarningIssued

Tracks warning actions.

Core fields:

```text
moderator
target_owner
passport_id
reason_code
```

---

## MuteIssued

Tracks temporary mute actions.

Core fields:

```text
moderator
target_owner
passport_id
channel_id
reason_code
expires_at_ms
```

---

## ChannelBanIssued

Tracks channel ban actions.

Core fields:

```text
moderator
target_owner
passport_id
channel_id
reason_code
expires_at_ms
```

---

## BlackPassportIssued

Tracks formal moderation action that applies Black Passport.

Core fields:

```text
moderator
target_owner
passport_id
reason_code
respawn_at_ms
```

---

# Admin Events

## AdminAction

Tracks sensitive protocol authority actions.

Core fields:

```text
admin_cap_id
action_type
target
```

Current AdminAction categories include:

```text
Badge issuer approval
Pro upgrade
Elite upgrade
Warning
Mute
Channel ban
Black Passport
Appeal resolution
Jury case opening
Jury case closing
Cosmetic unlock grant
Recovery resolution
Channel verification
```

---

# Appeal Events

## AppealOpened

Tracks appeal case creation.

Core fields:

```text
appeal_id
appellant
passport_id
moderation_record_id
moderation_action_type
moderation_reason_code
```

---

## AppealResolved

Tracks appeal resolution.

Core fields:

```text
appeal_id
appellant
passport_id
result_status
resolution_code
```

Appeal results:

```text
Approved
Denied
Modified
```

---

# Jury Events

## JuryCaseOpened

Tracks advisory jury case creation.

Core fields:

```text
jury_case_id
appeal_id
appellant
passport_id
required_votes
```

---

## JuryVoteSubmitted

Tracks juror vote submission.

Core fields:

```text
jury_case_id
appeal_id
vote
```

---

## JuryCaseClosed

Tracks final advisory jury recommendation.

Core fields:

```text
jury_case_id
appeal_id
final_recommendation
approve_votes
deny_votes
modify_votes
```

---

# Squad Events

## SquadCreated

Tracks Squad creation.

Core fields:

```text
squad_id
owner
owner_passport_id
max_slots
```

---

## SquadMemberSponsored

Tracks Squad sponsorship.

Core fields:

```text
squad_id
sponsor
member
```

---

# Guild Events

## GuildCreated

Tracks Guild creation.

Core fields:

```text
guild_id
owner
owner_passport_id
max_members
is_public
```

---

## GuildMemberAdded

Tracks Guild member additions.

Core fields:

```text
guild_id
owner
member
role
```

---

## GuildUpdated

Tracks Guild metadata and visibility updates.

Core fields:

```text
guild_id
owner
is_public
```

---

# Profile Events

## ProfileCreated

Tracks public Profile object creation.

Core fields:

```text
profile_id
owner
passport_id
is_public
```

---

## ProfileUpdated

Tracks Profile metadata and visibility updates.

Core fields:

```text
profile_id
owner
passport_id
is_public
```

Profile media and long-form metadata should remain off-chain.

---

# Title Events

## TitleClaimed

Tracks earned title proof creation.

Core fields:

```text
owner
passport_id
title_type
source_code
```

---

## TitleDisplayCreated

Tracks TitleDisplay creation.

Core fields:

```text
owner
passport_id
```

---

## TitleEquipped

Tracks equipped title changes.

Core fields:

```text
owner
passport_id
title_type
```

Titles are earned display identity.

They are not membership or authority.

---

# Cosmetic Events

## CosmeticUnlocked

Tracks CosmeticUnlock proof creation.

Core fields:

```text
owner
passport_id
cosmetic_type
cosmetic_code
source_code
```

---

## CosmeticLoadoutCreated

Tracks CosmeticLoadout creation.

Core fields:

```text
owner
passport_id
```

---

## CosmeticEquipped

Tracks equipped cosmetic changes.

Core fields:

```text
owner
passport_id
cosmetic_type
cosmetic_code
```

Cosmetics are display customization.

They do not grant reputation, verification, or moderation power.

---

# Recovery Events

## RecoveryRequested

Tracks recovery request creation.

Core fields:

```text
recovery_id
requester
identity_id
passport_id
current_owner
requested_new_owner
```

Recovery evidence should stay off-chain or encrypted.

---

## RecoveryResolved

Tracks recovery request resolution.

Core fields:

```text
recovery_id
requester
identity_id
passport_id
result_status
resolution_code
```

Current recovery resolution does not transfer ownership yet.

---

# Backend Indexing Priorities

The first backend indexer should prioritize:

```text
IdentityCreated
PassportCreated
IdentityVerified
BadgeMinted
BadgeIssuedByIssuer
BoostUsed
ChannelCreated
ChannelVerified
ChannelAccessPolicyCreated
ChannelAccessRuleUpdated
ConductSignalUpdated
PassportDowned
PassportRespawned
WarningIssued
MuteIssued
ChannelBanIssued
BlackPassportIssued
AppealOpened
AppealResolved
JuryCaseOpened
JuryVoteSubmitted
JuryCaseClosed
SquadCreated
SquadMemberSponsored
GuildCreated
GuildMemberAdded
ProfileCreated
ProfileUpdated
TitleClaimed
TitleEquipped
CosmeticUnlocked
CosmeticEquipped
RecoveryRequested
RecoveryResolved
```

These events are enough to power early:

```text
Passport profiles
Channel pages
Access policy views
Badge history
Boost history
Moderation dashboards
Appeal dashboards
Jury review dashboards
Squad and Guild displays
Profile customization
Recovery review dashboards
```

---

# Event Privacy Rules

On-chain events may expose protocol state.

They should not expose sensitive evidence.

For moderation, appeals, jury, and recovery:

* Store case IDs and public references on-chain
* Keep private evidence off-chain
* Use encrypted or controlled storage where needed
* Avoid exposing unnecessary wallet-linked identity context in public UI

---

# Future Events

Future modules may add events for:

```text
MembershipRenewed
MembershipExpired
BoostCycleClosed
DiscoverySnapshotCreated
DeveloperVerified
GuildRoleUpdated
GuildMemberRemoved
CosmeticRevoked
TitleRevoked
RecoveryOwnershipTransferred
```

---

# Related Docs

```text
docs/onchain.md
docs/systems.md
docs/access-control.md
docs/moderation.md
docs/conduct-system.md
docs/customization.md
docs/recovery.md
```

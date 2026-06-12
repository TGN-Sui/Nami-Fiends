# Nami Events

## Purpose

Nami events make protocol activity indexable.

Events allow the backend, frontend, analytics, discovery engine, moderation tools, and future SDKs to reconstruct user-facing timelines without storing every derived view on-chain.

Events should be treated as protocol history.

Objects store state.

Events describe important state changes.

---

## Current Status

Current Move package:

```text
contracts/nami
```

Current status:

```text
33 tests passing
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
channel_access.move
conduct.move
moderation.move
admin.move
appeals.move
jury.move
squad.move
```

---

# Event Design Rules

Events should be:

* Small
* Indexable
* Useful to backend services
* Safe to expose publicly
* Free of private evidence
* Free of raw personal identity data

Events should not include:

* Private chat logs
* Private moderation evidence
* Private appeal evidence
* Emails
* Real names
* Raw linked social account data
* Recovery secrets

---

# Identity Events

## IdentityCreated

Module:

```move
identity.move
```

Purpose:

Tracks new Identity creation.

Used by:

* Profile indexing
* Identity lookup
* Onboarding analytics
* Future recovery workflows

Core fields:

```text
identity_id
owner
```

---

# Passport Events

## PassportCreated

Module:

```move
passport.move
```

Purpose:

Tracks Passport creation.

Used by:

* Passport profile indexing
* Onboarding timelines
* Identity-to-Passport mapping

Core fields:

```text
passport_id
identity_id
```

---

## XPAdded

Module:

```move
passport.move
```

Purpose:

Tracks XP updates.

Used by:

* Progression timeline
* Level display
* Seasonal stats
* Future prestige analytics

Core fields:

```text
passport_id
amount
```

---

## BadgePointsAdded

Module:

```move
passport.move
```

Purpose:

Tracks badge point updates.

Used by:

* Reputation timeline
* Badge contribution analytics
* Progression display

Core fields:

```text
passport_id
amount
total
```

---

## TierUpgraded

Module:

```move
passport.move
```

Purpose:

Tracks membership tier changes.

Used by:

* Access history
* Membership display
* Admin audit views

Core fields:

```text
passport_id
old_tier
new_tier
```

---

# Verification Events

## IdentityVerified

Module:

```move
verification.move
```

Purpose:

Tracks successful verification.

Used by:

* NPC to Adventurer history
* Verification dashboards
* Trust-system indexing

Core fields:

```text
identity_id
passport_id
owner
source
verification_level
```

---

# Badge Events

## BadgeMinted

Module:

```move
badge.move
```

Purpose:

Tracks Badge object creation.

Used by:

* Badge history
* Profile display
* Reputation inputs
* Achievement timelines

Core fields:

```text
owner
badge_type
points
```

---

## BadgeIssuerCreated

Module:

```move
badge_issuer.move
```

Purpose:

Tracks approved badge issuer capability creation.

Used by:

* Issuer registry
* Admin audit trail
* Badge quality review

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

Module:

```move
badge_issuer.move
```

Purpose:

Tracks badge issuance through an approved issuer.

Used by:

* Badge issuer analytics
* Badge quality scoring
* Anti-abuse review
* Reputation integrity checks

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

Module:

```move
boost.move
```

Purpose:

Tracks channel/community boost usage.

Used by:

* Discovery ranking
* Weekly boost cycles
* Channel momentum
* Anti-abuse checks

Core fields:

```text
owner
channel_id
power
tier
week_id
```

---

# Channel Access Events

## ChannelAccessPolicyCreated

Module:

```move
channel_access.move
```

Purpose:

Tracks channel access policy creation.

Used by:

* Channel settings UI
* Access indexing
* Developer/channel dashboards

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

Module:

```move
channel_access.move
```

Purpose:

Tracks channel access policy changes.

Used by:

* Audit logs
* Channel settings history
* Moderation review
* Access debugging

Core fields:

```text
owner
channel_id
allow_npc_chat
minimum_tier
minimum_reputation
```

---

# Conduct Events

## ConductStatusCreated

Module:

```move
conduct.move
```

Purpose:

Tracks initial Conduct Signal setup.

Used by:

* Profile display
* Conduct timeline
* Trust-system indexing

Core fields:

```text
owner
passport_id
signal
```

---

## ConductSignalUpdated

Module:

```move
conduct.move
```

Purpose:

Tracks Conduct Signal changes.

Used by:

* Public profile updates
* Conduct history
* Moderation audit trails

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

Module:

```move
conduct.move
```

Purpose:

Tracks Black Passport status.

Used by:

* Moderation dashboard
* Benefit restriction checks
* Public respawn display

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

Module:

```move
conduct.move
```

Purpose:

Tracks restoration from Black Passport status.

Used by:

* Conduct timeline
* Profile display
* Moderation history

Core fields:

```text
owner
passport_id
restored_signal
```

---

# Moderation Events

## WarningIssued

Module:

```move
moderation.move
```

Purpose:

Tracks warning actions.

Used by:

* Moderation history
* Appeal eligibility
* Admin review

Core fields:

```text
moderator
target_owner
passport_id
reason_code
```

---

## MuteIssued

Module:

```move
moderation.move
```

Purpose:

Tracks temporary chat mute actions.

Used by:

* Chat access checks
* Channel moderation dashboards
* Appeal workflows

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

Module:

```move
moderation.move
```

Purpose:

Tracks channel ban actions.

Used by:

* Channel access checks
* Channel moderation history
* Appeal workflows

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

Module:

```move
moderation.move
```

Purpose:

Tracks formal moderation action that causes Black Passport status.

Used by:

* Global moderation history
* Appeals
* Trust-system analysis
* Respawn display

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

Module:

```move
admin.move
```

Purpose:

Tracks sensitive protocol authority actions.

Used by:

* Admin audit logs
* Security review
* Internal dashboards
* Future governance migration

Core fields:

```text
admin_cap_id
action_type
target
```

Admin actions currently include:

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
```

---

# Appeal Events

## AppealOpened

Module:

```move
appeals.move
```

Purpose:

Tracks appeal case creation.

Used by:

* Appeal dashboard
* Moderation review
* Jury routing

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

Module:

```move
appeals.move
```

Purpose:

Tracks appeal resolution.

Used by:

* Appeal timeline
* Moderation history
* Trust review

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

Module:

```move
jury.move
```

Purpose:

Tracks advisory jury case creation.

Used by:

* Jury dashboard
* Appeal review
* Community review timelines

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

Module:

```move
jury.move
```

Purpose:

Tracks juror vote submission.

Used by:

* Jury vote counting
* Advisory review dashboards
* Anti-abuse monitoring

Core fields:

```text
jury_case_id
appeal_id
vote
```

Note:

Juror identity should be handled carefully in the UI and backend.

---

## JuryCaseClosed

Module:

```move
jury.move
```

Purpose:

Tracks final advisory jury recommendation.

Used by:

* Appeal review
* Admin resolution support
* Community transparency

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

Module:

```move
squad.move
```

Purpose:

Tracks Squad creation.

Used by:

* Squad profile indexing
* Social graph views
* Membership benefit analytics

Core fields:

```text
squad_id
owner
owner_passport_id
max_slots
```

---

## SquadMemberSponsored

Module:

```move
squad.move
```

Purpose:

Tracks Squad sponsorship.

Used by:

* Squad membership display
* Sponsorship history
* Trust graph analysis

Core fields:

```text
squad_id
sponsor
member
```

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
```

These events are enough to power an early Passport profile, moderation dashboard, appeal dashboard, jury dashboard, squad display, and discovery prototype.

---

# Event Privacy Rules

Events may expose protocol state.

Events should not expose sensitive evidence.

Private evidence should be stored off-chain, encrypted, or referenced through hashes/URIs.

For appeals and jury:

* Store case IDs and public references on-chain
* Keep private evidence off-chain
* Avoid revealing wallet-linked identity context unnecessarily in public UI

---

# Future Events

Future modules may add events for:

```text
GuildCreated
GuildMemberJoined
GuildRoleUpdated
CosmeticUnlocked
TitleUnlocked
RecoveryRequested
RecoveryCompleted
MembershipRenewed
MembershipExpired
BoostCycleClosed
DiscoverySnapshotCreated
```

---

# Related Docs

For object schemas and system boundaries, see:

```text
docs/onchain.md
docs/systems.md
docs/moderation.md
docs/conduct-system.md
docs/access-control.md
```

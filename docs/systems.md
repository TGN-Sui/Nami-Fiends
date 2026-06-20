# Nami Systems Overview

## Purpose

Nami is a modular gaming identity, reputation, access, moderation, customization, and social protocol.

Each system owns a clear responsibility.

Nami should avoid mixing ownership, progression, access, reputation, conduct, moderation, customization, and recovery into one object.

---

## Current Status

Current package:

```text
contracts/nami
```

Current protocol status:

```text
55 tests passing
0 warnings
```

Current MVP progress:

```text
[██████████████░░░░░░] 71%
```

---

# Current Systems

Implemented systems:

```text
Identity
Passport
Verification
Membership
Reputation
Badge
Badge Issuer
Boost
Channel
Channel Access
Conduct
Moderation
Admin Authority
Appeals
Jury
Squads
Guilds
Profile
Titles
Cosmetics
Recovery
Errors
```

Current Move modules:

```text
admin.move
appeals.move
badge.move
badge_issuer.move
boost.move
channel.move
channel_access.move
conduct.move
cosmetics.move
errors.move
guild.move
identity.move
jury.move
membership.move
moderation.move
passport.move
profile.move
recovery.move
squad.move
title.move
verification.move
```

---

# System Responsibility Map

## Identity

Answers:

```text
Who owns this Nami presence?
```

Identity is the root ownership layer.

It should stay small and stable.

---

## Passport

Answers:

```text
What has this player done?
```

Passport stores progression, XP, level, badge points, reputation, archetype, membership tier, and future prestige hooks.

New Passports start as:

```text
NPC
```

---

## Verification

Answers:

```text
Has this user proven enough authenticity to unlock trusted access?
```

Verification currently controls:

```text
NPC → Adventurer
```

Verification does not create reputation.

---

## Membership

Answers:

```text
What benefits can this user access?
```

Current tiers:

```text
NPC
Adventurer
Pro
Elite
```

Membership controls access, not reputation.

---

## Reputation

Answers:

```text
What has this user earned?
```

Reputation is stored in Passport.

Current inputs include:

* Badge points
* XP
* Level progression

Reputation cannot be purchased.

---

## Badge

Answers:

```text
What achievement or activity proof has this user earned?
```

Current badge types:

```text
Basic
Event
Completion
```

Badge points feed Passport progression and reputation.

---

## Badge Issuer

Answers:

```text
Who is allowed to issue badge types?
```

Badge Issuer authority protects reputation quality.

Completion Badge permission must be explicit.

---

## Boost

Answers:

```text
What discovery signal has this user spent?
```

Boosts are discovery signals.

Boosts are not governance, reputation, moderation power, or ownership.

---

## Channel

Answers:

```text
What public or private community/channel space exists?
```

Channels are creator/community spaces.

Channels support owner, metadata references, visibility, and verification.

Verified Channels are currently approved through AdminCap.

---

## Channel Access

Answers:

```text
Who can chat in this Channel?
```

Channel Access policies now use real Channel ownership.

Current policy controls:

```text
Allow NPC Chat
Minimum Tier
Minimum Reputation
```

Chat can also be blocked by Conduct and Moderation.

---

## Conduct

Answers:

```text
What kind of interaction should others expect right now?
```

Current signals:

```text
Green
Orange
Red
Black
```

Black Passport restricts active benefits.

---

## Moderation

Answers:

```text
What restrictions are currently applied?
```

Current moderation actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

Mutes and channel bans block chat.

Black Passport restricts broader benefits through Conduct.

---

## Admin Authority

Answers:

```text
Who can perform sensitive MVP actions?
```

AdminCap currently controls:

```text
Badge issuer approval
Pro / Elite upgrades
Moderation actions
Appeal resolution
Jury case open / close
Cosmetic unlock grants
Recovery resolution
Channel verification
```

AdminCap is the MVP authority model, not the final governance model.

---

## Appeals

Answers:

```text
How can a user challenge a moderation action?
```

Current flow:

```text
Moderation action → Appeal opened → Admin resolution
```

Private evidence should stay off-chain.

---

## Jury

Answers:

```text
What does the trusted community recommend for this appeal?
```

Current flow:

```text
Appeal → JuryCase → Pro/Elite vote → Recommendation
```

Jury is advisory during MVP.

---

## Squads

Answers:

```text
Who does this player personally sponsor or trust?
```

Squads are small trust and sponsorship groups.

Current eligibility:

```text
Pro or Elite
No active Black Passport
```

---

## Guilds

Answers:

```text
What larger community does this player belong to or lead?
```

Guilds are larger persistent communities.

Current eligibility:

```text
Adventurer, Pro, or Elite
No active Black Passport
```

Guilds are separate from Squads.

---

## Profile

Answers:

```text
How does this Passport appear publicly?
```

Profiles store public display references:

```text
Display name
Bio reference
Avatar reference
Metadata reference
Public/private setting
```

NPC users may create Profiles.

Black Passport blocks Profile updates.

---

## Titles

Answers:

```text
What earned identity label is this user displaying?
```

Current title flow:

```text
Passport reputation → EarnedTitle → TitleDisplay
```

Titles are display recognition.

Titles do not grant membership or authority.

---

## Cosmetics

Answers:

```text
What visual customization has this user unlocked or equipped?
```

Current cosmetic flow:

```text
AdminCap grants CosmeticUnlock
User creates CosmeticLoadout
User equips owned unlock
```

Cosmetics are display customization only.

They do not grant reputation, verification, membership, or authority.

---

## Recovery

Answers:

```text
How can a user request help regaining access?
```

Current flow:

```text
Identity + Passport → RecoveryRequest → Admin resolution
```

Recovery does not transfer ownership yet.

---

## Errors

Answers:

```text
What shared abort codes are used across the protocol?
```

The Error System centralizes abort codes and getter functions.

Modules should use shared error getters where possible.

---

# Effective Access Model

Nami does not rely only on raw Passport tier.

Effective access may include:

```text
Passport tier
+ Conduct status
+ Channel policy
+ Moderation records
```

Black Passport forces active benefits into NPC-equivalent restrictions while active.

This currently affects:

```text
Boosts
Channel chat
Squad access
Guild actions
Jury eligibility
Profile updates
Title claiming/equipping
Cosmetic equipping
```

---

# System Boundaries

## Access Is Not Reputation

Membership controls access.

Reputation reflects earned contribution.

---

## Verification Is Not Reputation

Verification proves authenticity.

Reputation must still be earned.

---

## Conduct Is Not Reputation

Conduct communicates interaction style or restriction state.

Red is not punishment.

Black is punishment.

---

## Boosts Are Not Governance

Boosts influence discovery.

Boosts do not grant ownership, moderation power, or governance rights.

---

## Cosmetics Are Not Reputation

Cosmetics express identity.

Cosmetics do not create trust, authority, or earned standing.

---

## Titles Are Not Membership

Titles show earned recognition.

Titles do not unlock premium benefits by themselves.

---

## Squads Are Not Guilds

Squads are small trust groups.

Guilds are larger community structures.

---

## Appeals Are Not Evidence Storage

Appeals should reference evidence.

Private evidence should stay off-chain or encrypted.

---

## Recovery Is Not Ownership Transfer Yet

Recovery currently records requests and resolutions.

Ownership transfer should wait for a mature security model.

---

# Current Test Coverage

Current status:

```text
55 tests passing
0 warnings
```

Tests currently cover:

```text
Identity and Passport creation
NPC default state
Verification
Membership upgrades
Badge progression
Badge issuer permissions
Boost access
Channel creation/update/verification
Channel access policy ownership
Conduct restrictions
Moderation enforcement
Admin authority
Appeals
Jury review
Squads
Guilds
Profiles
Titles
Cosmetics
Recovery
```

---

# Frontend Submission Systems (Local MVP)

These run in the browser today (localStorage + custom events). Officials review in Settings → Advanced → Submissions.

```text
Game submission tickets     game-submission-ticket-store.ts
Game Trust Score            game-trust-score.ts
User suggestions            nami-user-suggestions-store.ts
Partner banner submissions  partner-banner-submission-store.ts
Game owner session          game-owner-session-store.ts
Pre-approval guards         game-owner-approval-guards.ts
```

See [game-onboarding.md](./game-onboarding.md) and [officials-submissions.md](./officials-submissions.md).

---

# Future Systems

Planned or likely future systems:

```text
Backend persistence for officials submission queues
Backend event indexer
Full protocol wiring for Passport/Profile UI
SDK helpers
zkLogin production flow
Developer identity on-chain
Membership records
Guild roles
Discovery anchors
Cosmetic registry
Recovery ownership transfer
Scenario/adversarial test suite
```

---

# Design Principles

Identity owns presence.

Passport owns journey.

Verification unlocks trusted entry.

Membership controls access.

Reputation is earned.

Badges prove meaningful activity.

Conduct communicates interaction state.

Black Passport restricts active benefits.

Moderation protects communities.

Appeals create fairness.

Jury adds community voice.

Squads create small trust networks.

Guilds create larger communities.

Profiles display identity.

Titles recognize earned status.

Cosmetics express style.

Recovery protects continuity.

AdminCap secures MVP authority.

Backend powers scale.

Frontend creates the gamer experience.

SDK expands the ecosystem.

Sui anchors proof.

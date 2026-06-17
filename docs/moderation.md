# Nami Moderation

## Purpose

Moderation protects users, channels, squads, guilds, profiles, and the wider Nami protocol.

Moderation should be:

* Evidence-based
* Reviewable
* Appeal-friendly
* Resistant to mob punishment
* Clear to users
* Strong enough to stop abuse

Moderation actions should restrict harmful behavior without erasing earned history unless severe abuse requires deeper review.

---

## Current Status

Current moderation-related modules:

```text
moderation.move
conduct.move
channel_access.move
appeals.move
jury.move
admin.move
profile.move
title.move
cosmetics.move
recovery.move
```

Current protocol status:

```text
77 tests passing
0 warnings
```

Phase 2 indexer: `ModerationService`, `AppealService`, `JuryService` project on-chain moderation events to read-only HTTP routes (`/api/moderation`, `/api/appeals`, `/api/jury`).

---

# Current Moderation Actions

Nami currently supports four moderation actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

---

## Warning

A Warning creates a moderation record.

Current effect:

```text
Record only
```

Warnings do not currently block access by themselves.

Warnings may later affect:

* Trust scoring
* Appeal context
* Jury eligibility
* Repeat-offender escalation
* Moderation dashboards
* Discovery health signals

---

## Mute

A Mute blocks chat for a matching channel while active.

Current effect:

```text
Blocks channel chat
```

Mute records include:

* Moderator
* Target owner
* Passport ID
* Channel ID
* Reason code
* Expiration timestamp

Mutes do not currently block profile updates, titles, cosmetics, squads, or guilds.

---

## Channel Ban

A Channel Ban blocks chat for a matching channel while active.

Current effect:

```text
Blocks channel chat
```

Channel bans are stronger than mutes and may represent removal from a specific channel/community space.

Channel bans do not currently apply globally unless paired with Black Passport or other future restrictions.

---

## Black Passport

Black Passport is the global moderation penalty state.

Public language:

```text
Passport downed. Respawning in...
```

Current effect:

```text
Conduct Signal becomes Black
Effective tier falls back to NPC-equivalent restrictions
```

Black Passport currently blocks:

* Boosts
* Channel chat
* Channel creation
* Squad benefits
* Guild actions
* Jury eligibility
* Profile updates
* Title claiming
* Title equipping
* Cosmetic equipping
* Premium benefit access through effective tier

Black Passport should not erase earned Passport history by default.

Badges, reputation, titles, cosmetics, guild history, squad history, appeals, and recovery history should remain intact unless severe abuse requires separate review.

---

# Conduct Integration

Moderation uses Conduct to apply Black Passport restrictions.

Related module:

```move
module nami::conduct
```

Current Conduct Signals:

```text
Green
Orange
Red
Black
```

Green, Orange, and Red are public interaction signals.

Black is reserved for moderation.

Users cannot select Black themselves.

---

# Channel Access Integration

Moderation records are used by channel access checks.

Related module:

```move
module nami::channel_access
```

Current chat-blocking inputs:

```text
Channel policy
Conduct status
Moderation record
```

Chat can be blocked by:

* NPC chat disabled
* Minimum tier not met
* Minimum reputation not met
* Active Black Passport
* Active mute
* Active channel ban

Channel access policies are now tied to real Channel ownership.

---

# Admin Authority

Moderation actions are currently exposed through AdminCap.

Related module:

```move
module nami::admin
```

Current AdminCap moderation powers:

```text
Issue warning
Issue mute
Issue channel ban
Issue Black Passport
```

Direct moderation functions remain package-gated.

This prevents normal users from creating moderation records or downing Passports.

---

# Moderation Records

Current object:

```move
ModerationRecord
```

Current fields track:

* Moderator
* Target owner
* Passport ID
* Action type
* Channel ID
* Reason code
* Expiration timestamp
* Creation timestamp

Moderation records support:

* Appeal creation
* Access checks
* Admin audits
* Backend moderation timelines
* Future repeat-offender logic

---

# Appeals

Users may appeal moderation actions.

Related module:

```move
module nami::appeals
```

Current appeal flow:

```text
Moderation action → Appeal opened → Admin resolution
```

Appeal outcomes:

```text
Approved
Denied
Modified
```

Private evidence should not be stored directly on-chain.

Appeal cases should reference off-chain evidence, summaries, hashes, encrypted references, or public case labels.

---

# Jury Review

Jury review is currently advisory.

Related module:

```move
module nami::jury
```

Current jury flow:

```text
Appeal → JuryCase → Pro/Elite juror vote → Recommendation
```

Juror eligibility currently requires:

```text
Pro or Elite effective tier
No active Black Passport
```

Jury recommendations do not automatically override Admin resolution yet.

---

# Profile, Titles, and Cosmetics

Moderation affects customization through Black Passport.

Related modules:

```text
profile.move
title.move
cosmetics.move
```

While Black Passport is active:

```text
Profile updates are blocked
Title claiming is blocked
Title equipping is blocked
Cosmetic equipping is blocked
```

Existing Profiles, EarnedTitles, CosmeticUnlocks, and CosmeticLoadouts are not deleted by default.

---

# Recovery Relationship

Recovery is separate from moderation.

Related module:

```move
module nami::recovery
```

A user may open a RecoveryRequest even if moderation history exists.

Recovery should not be used to bypass moderation.

Current recovery does not transfer ownership automatically.

Future recovery review should consider active severe moderation restrictions before approving any ownership transfer.

---

# Privacy Rules

Moderation should avoid exposing unnecessary private data.

Do not store on-chain:

```text
Private chat logs
Private moderation evidence
Private appeal evidence
Private recovery evidence
Real names
Emails
Raw linked social accounts
Private game account IDs
Personal documents
```

Use on-chain records for state and references.

Use off-chain systems for sensitive evidence.

---

# Reason Codes

Current moderation functions use numeric reason codes.

Reason codes allow frontend/backend systems to map moderation actions to human-readable categories.

Future examples may include:

```text
Spam
Harassment
Scam
Botting
Hate speech
Impersonation
Exploit abuse
Channel rule violation
Protocol rule violation
```

Reason code values should stay stable while display text can evolve.

---

# Escalation Model

Future moderation escalation may follow:

```text
Warning
→ Mute
→ Channel Ban
→ Black Passport
→ Permanent restriction
```

Escalation should depend on:

* Severity
* Repetition
* Evidence quality
* Channel rules
* Protocol rules
* Appeal outcomes
* Jury recommendation
* Moderator authority

---

# Community Reports

Community reports should not directly punish users.

Reports may trigger:

* Review
* Evidence collection
* Moderator attention
* Temporary safety limits
* Appeal context
* Jury review eligibility

Punishment should require authority, evidence, and auditability.

---

# Current Test Coverage

Current tests verify:

```text
Warning creation
Mute creation
Channel ban creation
Black Passport issuance
Black Passport disables benefits
Black Passport blocks chat
Mute blocks channel chat
Channel ban blocks channel chat
AdminCap can issue moderation actions
Appeals can be opened from moderation records
Jury review can be opened for appeals
Black Passport blocks Profile updates
Black Passport blocks Title claiming
Black Passport blocks Cosmetic equipping
```

---

# Future Work

Planned moderation improvements:

```text
Moderator roles
Channel moderator authority
Guild moderator authority
Evidence references
Appeal evidence privacy
Jury anonymity
Cooldowns
Repeat-offender escalation
Permanent restrictions
Moderation dashboards
Emergency pause controls
Recovery-aware moderation review
```

---

# Design Rules

Moderation should protect users without becoming arbitrary.

Black Passport should restrict active benefits without erasing history by default.

Warnings should create context, not automatic punishment.

Mutes and channel bans should be channel-specific.

Appeals should be available and reviewable.

Jury should begin advisory before becoming binding.

Private evidence should stay off-chain or encrypted.

Recovery should not bypass moderation.

---

# Related Docs

```text
docs/conduct-system.md
docs/access-control.md
docs/appeals.md
docs/jury.md
docs/admin.md
docs/events.md
docs/customization.md
docs/recovery.md
```

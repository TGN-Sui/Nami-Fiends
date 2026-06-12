# Nami Moderation

## Purpose

Moderation protects users, channels, squads, future guilds, and the wider Nami protocol.

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
```

Current protocol status:

```text
33 tests passing
0 warnings
```

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

---

## Channel Ban

A Channel Ban blocks chat for a matching channel while active.

Current effect:

```text
Blocks channel chat
```

Channel bans are stronger than mutes and may represent removal from a channel/community space.

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
* Squad benefits
* Jury eligibility
* Premium benefit access through effective tier

Black Passport should not erase earned Passport history by default.

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

Appeal cases should reference off-chain evidence, summaries, hashes, or public case labels.

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

# Privacy Rules

Moderation should avoid exposing unnecessary private data.

Do not store on-chain:

* Private chat logs
* Private moderation evidence
* Private appeal evidence
* Real names
* Emails
* Raw linked social accounts
* Private game account IDs

Use on-chain records for state and references.

Use off-chain systems for sensitive evidence.

---

# Reason Codes

Current moderation functions use numeric reason codes.

Reason codes allow the frontend/backend to map moderation actions to human-readable categories.

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

The code should stay stable while display text can evolve.

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
* Jury review eligibility

Punishment should require authority, evidence, and auditability.

---

# Current Test Coverage

Current tests verify:

* Warning creation
* Black Passport issuance
* Black Passport disables benefits
* Black Passport blocks chat
* Mute blocks channel chat
* Channel ban blocks channel chat
* AdminCap can issue moderation actions
* Appeals can be opened from moderation records
* Jury review can be opened for appeals

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
```

---

# Related Docs

```text
docs/conduct-system.md
docs/access-control.md
docs/appeals.md
docs/jury.md
docs/admin.md
docs/events.md
```

# Nami Appeals

## Purpose

Appeals give users a review path after moderation actions.

Appeals are designed to make moderation more fair, transparent, and reviewable without exposing private evidence directly on-chain.

Appeals answer:

```text
How can a user challenge a moderation action?
```

---

## Current Status

Current module:

```move
module nami::appeals
```

Related modules:

```text
moderation.move
admin.move
jury.move
passport.move
```

Current protocol status:

```text
33 tests passing
0 warnings
```

---

# Appeal Flow

Current flow:

```text
Moderation action → Appeal opened → Admin resolution
```

Optional advisory flow:

```text
Appeal opened → JuryCase opened → Jury votes → Jury recommendation → Admin resolution
```

Jury recommendations are advisory during MVP.

---

# AppealCase

Current object:

```move
AppealCase
```

Current purpose:

* References a moderation record
* Tracks the appellant
* Tracks the linked Passport
* Stores moderation action context
* Stores appeal status
* Stores public reference
* Stores resolution code

AppealCase should not store private evidence directly.

---

# Appeal Statuses

Current statuses:

```text
Open
Approved
Denied
Modified
```

## Open

The appeal has been created and is waiting for review.

## Approved

The appeal was accepted.

This may later mean the moderation action should be reversed or reduced.

## Denied

The appeal was rejected.

The original moderation action remains valid.

## Modified

The appeal resulted in a changed outcome.

This may later support reduced penalties, altered expiration times, or adjusted reason codes.

---

# Opening an Appeal

A user may open an appeal for their own moderation record.

Current requirements:

```text
Moderation record target = sender
Moderation record Passport ID = user's Passport ID
```

This prevents users from opening appeals for unrelated moderation records.

---

# Resolving an Appeal

Appeal resolution is currently controlled by:

```move
module nami::admin
```

AdminCap can resolve an appeal as:

```text
Approved
Denied
Modified
```

This is the MVP authority model.

Future versions may include stronger jury influence, multi-admin review, or channel/guild-specific appeal authority.

---

# Public Reference

AppealCase includes a `public_reference` field.

This should be used for:

```text
Public case label
Off-chain evidence reference
Evidence hash
Moderation summary reference
Encrypted storage reference
```

It should not contain:

```text
Private chat logs
Private evidence
Real names
Emails
Raw social handles
Private game account IDs
Personal documents
```

Private evidence belongs off-chain or encrypted.

---

# Jury Relationship

Appeals may be routed to Jury review.

Related module:

```move
module nami::jury
```

Current jury role:

```text
Advisory recommendation
```

Jury can recommend:

```text
Approved
Denied
Modified
```

Admin still performs final appeal resolution during MVP.

---

# Moderation Relationship

Appeals are tied to moderation records.

Related module:

```move
module nami::moderation
```

Appealable moderation actions currently include:

```text
Warning
Mute
Channel Ban
Black Passport
```

Future versions may define which actions are automatically appealable and which require special review.

---

# Current Events

Appeals emit:

```text
AppealOpened
AppealResolved
```

Detailed event fields are documented in:

```text
docs/events.md
```

---

# Current Test Coverage

Current tests verify:

* User can open appeal for their own moderation record
* Appeal stores moderation reason context
* Appeal starts open
* AdminCap can resolve appeal
* Appeal can be approved
* Jury case can be opened from an appeal

---

# Future Work

Planned appeal improvements:

```text
Appeal deadlines
Appeal evidence references
Appeal privacy rules
Appeal status dashboard
Appeal cooldowns
Appeal spam prevention
Jury anonymity
Jury recommendation weighting
Penalty modification logic
Appeal-linked respawn updates
```

---

# Design Rules

Appeals should be easy to open but hard to abuse.

Appeals should protect user privacy.

Appeals should not expose private evidence on-chain.

Appeals should preserve moderation auditability.

Jury review should begin advisory before becoming binding.

AdminCap is acceptable for MVP but should evolve into more granular authority.

---

# Related Docs

```text
docs/moderation.md
docs/jury.md
docs/admin.md
docs/events.md
docs/access-control.md
docs/conduct-system.md
```

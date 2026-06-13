# Nami Recovery

## Purpose

Recovery gives users a formal path to request help regaining access to their Nami Identity and Passport.

Recovery must be careful.

It should protect users from account loss while also preventing account takeover.

---

## Current Status

Current module:

```move
module nami::recovery
```

Related modules:

```text
identity.move
passport.move
admin.move
events
```

Current protocol status:

```text
55 tests passing
0 warnings
```

---

# Current Recovery Model

The current Recovery System is intentionally conservative.

Current flow:

```text
Identity + Passport
→ RecoveryRequest
→ Admin resolution
```

Important:

```text
Recovery does not transfer Identity or Passport ownership yet.
```

The current system records the request and the review decision only.

Ownership transfer will be added later after stronger security, evidence, and policy rules exist.

---

# RecoveryRequest

Current object:

```move
RecoveryRequest
```

Current fields include:

* Requester
* Identity ID
* Passport ID
* Current owner
* Requested new owner
* Status
* Public reference
* Resolution code
* Created timestamp
* Resolved timestamp

---

# Recovery Statuses

Current statuses:

```text
Open
Approved
Denied
Modified
```

## Open

The request has been submitted and is waiting for review.

## Approved

The request was accepted.

During MVP, approval records a decision only.

It does not automatically transfer ownership.

## Denied

The request was rejected.

## Modified

The request resulted in a changed or partial decision.

This may later support staged recovery, additional evidence requirements, or limited restoration.

---

# Opening a Recovery Request

A user may open a recovery request for a linked Identity and Passport.

Current checks:

```text
Passport must be linked to the Identity
Requested new owner cannot be 0x0
```

The request stores:

```text
Current owner
Requested new owner
Public reference
```

---

# Public Reference

Recovery includes a `public_reference` field.

This should be used for:

```text
Case label
Off-chain evidence reference
Evidence hash
Encrypted storage reference
Support ticket reference
```

It should not contain:

```text
Private documents
Email addresses
Real names
Passwords
Seed phrases
Private account details
Raw social login data
Government ID data
```

Private recovery evidence belongs off-chain, encrypted, or inside a controlled support system.

---

# Admin Resolution

Recovery resolution is currently exposed through:

```move
module nami::admin
```

AdminCap can resolve a RecoveryRequest as:

```text
Approved
Denied
Modified
```

This is the MVP authority path.

Future recovery authority should be more cautious than normal admin actions.

---

# What Recovery Does Not Do Yet

Current recovery does not:

```text
Transfer Identity ownership
Transfer Passport ownership
Rotate keys
Change linked wallet
Erase moderation history
Erase badge history
Bypass Black Passport
Bypass appeals
```

This is intentional.

Recovery should become more powerful only after stronger rules exist.

---

# Future Recovery Direction

Future recovery may support:

```text
zkLogin recovery
Linked social account recovery
Linked game account recovery
Squad-supported recovery
Guild-supported recovery
Manual review
Multi-step recovery
Cooling-off periods
Challenge periods
Admin multi-approval
Evidence hash verification
Ownership transfer
```

---

# Security Rules

Recovery should avoid instant ownership transfer.

Recovery should require review and evidence.

Recovery should protect against social engineering.

Recovery should preserve audit history.

Recovery should not expose private evidence on-chain.

Recovery should not let attackers bypass moderation or ownership checks.

---

# Current Events

Recovery emits:

```text
RecoveryRequested
RecoveryResolved
```

Detailed event fields belong in:

```text
docs/events.md
```

---

# Current Test Coverage

Current tests verify:

* User can open a recovery request
* Recovery request links Identity and Passport
* Requested new owner is stored
* Recovery starts open
* Admin can approve recovery request
* Admin can deny recovery request
* Resolution code is stored

---

# Related Docs

```text
docs/identity.md
docs/passport.md
docs/admin.md
docs/access-control.md
docs/events.md
docs/resilience.md
```

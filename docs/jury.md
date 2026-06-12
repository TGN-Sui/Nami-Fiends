# Nami Jury System

## Purpose

The Jury System gives trusted community members a voice in appeal review.

Jury is currently advisory.

It does not automatically override moderation or admin decisions during MVP.

Jury answers:

```text
What does the trusted community recommend for this appeal?
```

---

## Current Status

Current module:

```move
module nami::jury
```

Related modules:

```text
appeals.move
admin.move
passport.move
membership.move
conduct.move
```

Current protocol status:

```text
33 tests passing
0 warnings
```

---

# Current Jury Flow

Current flow:

```text
Appeal opened
→ Admin opens JuryCase
→ Eligible juror submits vote
→ Admin closes JuryCase
→ Jury recommendation is recorded
```

The recommendation may support the final appeal resolution.

AdminCap still performs final appeal resolution during MVP.

---

# JuryCase

Current object:

```move
JuryCase
```

Purpose:

Tracks advisory review for an AppealCase.

Current JuryCase state includes:

* Appeal ID
* Appellant
* Passport ID
* Required vote count
* Approved vote count
* Denied vote count
* Modified vote count
* Case status
* Final recommendation
* Created timestamp
* Closed timestamp

---

# JuryVoteReceipt

Current object:

```move
JuryVoteReceipt
```

Purpose:

Creates proof that a juror submitted a vote.

Current receipt state includes:

* Jury case ID
* Appeal ID
* Juror Passport ID
* Vote
* Created timestamp

Future versions should consider privacy-preserving juror display.

---

# Jury Results

Current vote/result options:

```text
Approved
Denied
Modified
```

## Approved

The jury recommends accepting the appeal.

## Denied

The jury recommends rejecting the appeal.

## Modified

The jury recommends changing the moderation outcome rather than fully approving or denying it.

---

# Juror Eligibility

Current juror eligibility requires:

```text
Pro or Elite effective tier
No active Black Passport
```

Effective tier is conduct-aware.

This means a Pro or Elite user with active Black Passport status cannot serve as a juror.

---

# Conduct Relationship

Jury eligibility depends on Conduct.

Related module:

```move
module nami::conduct
```

Black Passport blocks jury eligibility.

Green, Orange, and Red do not block eligibility by themselves.

Future jury rules may add reputation, conflict-of-interest, cooldown, or moderation-history requirements.

---

# Appeal Relationship

Jury cases are opened from active appeals.

Related module:

```move
module nami::appeals
```

A JuryCase requires an open AppealCase.

A resolved appeal should not receive a new jury case.

---

# Admin Relationship

AdminCap currently controls:

```text
Open JuryCase
Close JuryCase
```

Related module:

```move
module nami::admin
```

This keeps jury routing controlled during MVP.

Future versions may support automated jury routing or role-based appeal moderators.

---

# Privacy Rules

Jury review should protect user privacy.

Jurors should review case events and evidence summaries without unnecessary identity exposure.

Do not expose:

```text
Real names
Emails
Raw social handles
Private game account IDs
Private chat logs
Wallet context beyond what is required
Unrelated moderation history
```

Private evidence should remain off-chain, encrypted, or referenced through hashes/URIs.

---

# Current Events

Jury emits:

```text
JuryCaseOpened
JuryVoteSubmitted
JuryCaseClosed
```

Detailed event fields are documented in:

```text
docs/events.md
```

---

# Current Test Coverage

Current tests verify:

* Admin can open a JuryCase for an AppealCase
* Required vote count is stored
* Pro juror can submit a vote
* APPEAL_DENIED vote path works
* Admin can close JuryCase
* Final recommendation is calculated
* JuryVoteReceipt is created

---

# Current Boundaries

Jury is advisory.

Jury does not directly:

* Remove moderation records
* Respawn Black Passport
* Modify mute expiration
* Modify channel ban expiration
* Resolve AppealCase
* Override AdminCap

Those actions remain controlled by current authority paths.

---

# Future Work

Planned improvements:

```text
Anonymous jury assignment
Random juror selection
Juror cooldowns
Conflict-of-interest checks
Minimum reputation requirements
Jury privacy packets
Jury evidence summaries
Jury decision weighting
Appeal outcome automation
Juror reputation effects
Anti-collusion checks
```

---

# Design Rules

Jury should increase fairness, not create mob punishment.

Jury should review evidence, not identity.

Jury should begin advisory before becoming binding.

Juror eligibility should require trust and good standing.

Private evidence should not be stored directly on-chain.

Black Passport users should not serve as jurors while restricted.

---

# Related Docs

```text
docs/appeals.md
docs/moderation.md
docs/admin.md
docs/access-control.md
docs/conduct-system.md
docs/events.md
docs/trust-system.md
```

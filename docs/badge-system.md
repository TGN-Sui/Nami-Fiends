# Nami Badge System

## Purpose

Badges are on-chain proofs of meaningful activity.

They support:

* Achievement history
* Passport progression
* XP
* Reputation
* Event participation
* Completion proof
* Future discovery quality signals

Badges should reward real participation, not passive actions.

---

## Current Status

Current modules:

```move
module nami::badge
module nami::badge_issuer
```

Current protocol status:

```text
33 tests passing
0 warnings
```

---

# Badge Types

Current badge types:

```text
Basic Badge       = 1 point
Event Badge       = 2 points
Completion Badge  = 3 points
```

Badge points feed Passport progression.

Current flow:

```text
Badge minted → Badge points added → XP updated → Reputation recalculated
```

---

# Basic Badge

Basic Badges represent lightweight participation or contribution.

Possible future examples:

* Joining a verified event
* Participating in a community activity
* Completing a basic task
* Early onboarding milestone

Basic Badges should not be spammed for meaningless actions.

---

# Event Badge

Event Badges represent participation in a stronger event or time-based activity.

Possible future examples:

* Tournament participation
* Developer-hosted playtest
* Community event
* Seasonal event
* Guild event

Event Badges should carry more weight than Basic Badges.

---

# Completion Badge

Completion Badges represent meaningful completion.

Possible future examples:

* Completed challenge
* Completed campaign milestone
* Completed tournament bracket
* Completed verified quest
* Completed developer-approved objective

Completion Badges require stronger issuer permission.

---

# What Should Not Issue Completion Badges

The following should not issue Completion Badges by themselves:

```text
Opening a game
Starting a new game
Joining a channel
Sending one message
Logging in
Idling online
Clicking a claim button without achievement
```

Completion must mean completion.

---

# Badge Object

Current object:

```move
Badge
```

Current fields include:

* Owner
* Badge type
* Points
* Source metadata hook

The source field may later reference:

* Game ID
* Channel ID
* Event ID
* Quest ID
* Guild ID
* Off-chain metadata hash

---

# Badge Issuer Authority

Badge creation is separated from badge permission.

```text
badge.move          = creates badge and applies points
badge_issuer.move   = controls who may issue badge types
```

This protects reputation from low-quality or abusive badge issuance.

---

# BadgeIssuerCap

Current object:

```move
BadgeIssuerCap
```

Current permissions:

```text
can_issue_basic
can_issue_event
can_issue_completion
```

Only approved issuers should receive BadgeIssuerCap.

---

# Issuer Types

Current issuer categories include:

```text
Nami Official
Verified Developer
Verified Channel
Approved Guild
Event Organizer
Partner Community
```

Issuer type helps the backend and future review systems understand badge context.

---

# Admin Approval

Badge issuer approval is currently controlled by:

```move
module nami::admin
```

AdminCap can approve BadgeIssuerCap objects.

This is the current MVP authority path.

Future versions may support:

* Developer-owned issuer approval
* Guild issuer authority
* Channel issuer authority
* Multi-admin approval
* Issuer suspension
* Issuer reputation

---

# Badge Points and Reputation

Badge points affect Passport progression.

Current progression path:

```text
Badge points → XP → Level progress → Reputation
```

Reputation is stored in Passport.

Reputation cannot be purchased.

Badge quality matters because badges directly influence earned standing.

---

# Anti-Abuse Rules

The Badge System should resist:

* Badge farming
* Bot farming
* Fake completion badges
* Issuer collusion
* Low-quality badge spam
* Pay-to-reputation behavior
* Repeated trivial achievements
* Duplicate reward abuse

Badge issuer authority is the first protection layer.

Future protections should include issuer trust, cooldowns, limits, reviews, and revocation.

---

# Current Events

Badge-related events:

```text
BadgeMinted
BadgeIssuerCreated
BadgeIssuedByIssuer
BadgePointsAdded
```

Event details are documented in:

```text
docs/events.md
```

---

# Current Test Coverage

Current tests verify:

* Badge minting updates Passport badge points
* Badge points update XP
* Badge points affect reputation
* Approved issuer can issue Completion Badge
* Issuer without Completion permission cannot issue Completion Badge
* AdminCap can approve BadgeIssuerCap

---

# Future Work

Planned improvements:

```text
Badge registry
Badge metadata standard
Issuer trust scores
Issuer limits
Completion Badge review
Badge revocation
Duplicate badge protection
Seasonal badge categories
Developer badge dashboards
Guild badge permissions
Badge display customization
```

---

# Design Rules

Badges should represent meaningful activity.

Badge quality is more important than badge quantity.

Completion Badges require strong authority.

Badge points should support reputation, not replace it.

Payment should not create reputation.

Badge evidence should be referenced, not fully stored on-chain.

---

# Related Docs

```text
docs/passport.md
docs/reputation.md
docs/events.md
docs/access-control.md
docs/admin.md
docs/trust-system.md
```

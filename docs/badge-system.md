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

On-chain: `badge_issuer.move` defines `ISSUER_VERIFIED_CHANNEL` for approved Game Channel programs.

---

# Onboarding and Platform Badges

Badges earned after [onboarding](./onboarding.md) follow stricter rules than generic mint paths.

## Act 2 — Claim

At Passport claim (target: single `enter_nami` PTB), the platform may mint an **onboarding Basic** badge tied to the gamer quiz archetype. This is flavor and entry standing, not achievement proof.

## Act 3 — Verified achievements

Platform-sourced badges (Steam, Epic, Xbox, etc.) require:

```text
Gamer has platform-verified link on Passport
achievement_unlocked_at >= passport.created_at_ms
Platform API confirms unlock at grant time
Achievement maps to an approved badge definition
```

Pre-Passport achievements are **never** claimable. Full rules: [verification.md](./verification.md).

## Unlink revocation

Unlinking a platform removes badges sourced from that link and recalculates XP/reputation. Relink does not restore removed badges.

---

# Verified Game Channel Badge Programs

Verified Game Channel owners may issue badges when gamers complete **verified platform achievements** on titles the channel provably controls.

This is separate from personal platform linking:

```text
Owner: platform link + game ownership proof + eligibility review
Owner: submits badge program questionnaire (achievement → badge mapping)
Admin: approves campaign before mint
Gamer: claims only while campaign active and rules satisfied
```

Example questionnaire shapes (polish later):

```text
Which achievement issues the game completion badge?
Which achievement issues a 50% completion Event badge (2 points)?
Which achievement issues a milestone Event badge?
```

Full policy: [channel-badge-programs.md](./channel-badge-programs.md).

Anti-shovelware eligibility applies before Completion-weight programs are approved.

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

# Frontend — Badge Collectors Book

The profile carousel **Badge Book** tab is implemented in `frontend/src/BadgeCollectorsBook.tsx` and styled in `phase7-ui.css`.

| Behavior | Detail |
| --- | --- |
| Closed book | One 720px-wide volume: back cover, spine, front cover titled **Nami Badges** (same page-face dimensions as open spreads). |
| Open | Front cover flips in 3D, then unmounts; inner spreads show six badge slots per face (12 per spread). |
| Page turns | `requestAnimationFrame` eased 3D rotation; drag, scroll wheel, or arrow controls. |
| Detail panel | Tapping a filled slot shows claim date, collector count, and rarity below the book. |

Carousel wiring: `ProfilePassportCarousel.tsx` (Passport ↔ Badge Book tabs). Mock badge data: `collectedBadgesForMember` / `userCollectedBadges` in `global-chats.js`.

---

# Related Docs

```text
docs/onboarding.md
docs/verification.md
docs/channel-badge-programs.md
docs/passport.md
docs/reputation.md
docs/events.md
docs/access-control.md
docs/admin.md
docs/trust-system.md
```

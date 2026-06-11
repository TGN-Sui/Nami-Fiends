# Nami Badge System

## Overview

Badges are achievement proofs within the Nami ecosystem.

Badges represent meaningful actions, participation, accomplishments, contributions, and milestones.

Badges affect:

* Passport progression
* Badge points
* XP
* Reputation
* Public identity
* Future cosmetic unlocks
* Future prestige rewards

Badges should reward meaningful activity, not passive presence.

---

## Core Principle

Achievement > Presence

Contribution > Activity

Quality > Quantity

Badges should not be issued for actions that are trivial, passive, or easily farmed.

---

## Badge Types

Nami initially supports three badge types:

* Basic Badge
* Event Badge
* Completion Badge

Future badge categories may include:

* Contribution Badge
* Legacy Badge
* Founder Badge
* Tournament Badge
* Creator Badge
* Guild Badge
* Channel Badge
* Prestige Badge

---

## Basic Badge

Basic Badges represent low-level participation or simple verified actions.

Point value:

1 point

Examples:

* Joined an official event
* Completed onboarding
* Participated in a verified community activity
* Attended a channel event
* Earned a starter badge
* Chose an onboarding archetype

Basic Badges should be easy to earn but still require a real action.

---

## Event Badge

Event Badges represent time-bound or organized participation.

Point value:

2 points

Examples:

* Participated in a tournament
* Joined a seasonal event
* Completed a limited-time challenge
* Participated in a developer-hosted playtest
* Joined a community quest
* Helped during a launch event

Event Badges should be tied to a specific event, timeframe, or coordinated activity.

---

## Completion Badge

Completion Badges represent meaningful verified completion.

Point value:

3 points

Examples:

* Finished a game campaign
* Completed a major questline
* Completed a verified raid
* Completed a season pass objective
* Reached a defined in-game milestone
* Completed a developer-approved challenge

Completion Badges must require clear evidence of completion.

Starting a new game must never qualify as a Completion Badge.

Launching a game must never qualify as a Completion Badge.

Joining a channel must never qualify as a Completion Badge.

Buying an item must never qualify as a Completion Badge by itself.

---

## Badge Quality Standards

Badge quality determines whether a badge should be issued and what type it should be.

Badge quality should consider:

* Difficulty
* Time required
* Skill required
* Contribution value
* Event importance
* Developer verification
* Community value
* Resistance to farming

Badges should not be issued for meaningless actions.

---

## Invalid Badge Examples

The following should not qualify as meaningful badge events by default:

* Opening a game
* Starting a new game
* Joining a public channel
* Sending one message
* Idling in a lobby
* Remaining online
* Buying a cosmetic
* Holding an NFT without activity
* Clicking a claim button with no achievement behind it

These actions may support onboarding or analytics, but they should not create reputation-weighted badges unless paired with meaningful completion or participation.

---

## Channel Badge Issuance

Verified channels may eventually issue badges.

Channel-issued badges must follow Nami badge quality standards.

Channel owners should not be able to freely issue high-value badges without limits, review, or reputation constraints.

---

## Verified Channel Badge Classes

### Channel Participation Badge

Equivalent to Basic Badge.

Used for:

* Participating in community events
* Joining structured activities
* Helping during channel events

---

### Channel Event Badge

Equivalent to Event Badge.

Used for:

* Tournament participation
* Seasonal event participation
* Developer-hosted events
* Community competitions

---

### Channel Completion Badge

Equivalent to Completion Badge.

Used only when:

* A meaningful objective was completed
* Completion can be verified
* The channel has authority to issue that badge
* The badge aligns with Nami quality rules

---

## Developer-Issued Badges

Verified game developers may issue badges for their games.

Developer-issued badges may represent:

* Alpha tester participation
* Beta tester participation
* Campaign completion
* Raid completion
* Tournament participation
* Community contribution
* Bug reporting
* Creator contribution

Developer-issued badges carry strong reputation value because issuer trust matters.

---

## Issuer Reputation

Badge value may eventually depend on issuer quality.

Possible issuer classes:

* Nami Official
* Verified Game Developer
* Verified Channel
* Guild
* Event Organizer
* Partner Community

Higher trust issuers may unlock higher badge issuance limits.

Lower trust issuers may have restricted badge types.

---

## Anti-Abuse Rules

Badge systems must resist:

* Badge farming
* Bot farming
* Pay-to-reputation schemes
* Fake completion claims
* Mass low-quality badge issuance
* Collusion between channels and users

High-value badges should be harder to issue than low-value badges.

---

## Badge Limits

Future versions may include:

* Daily badge issuance limits
* Weekly badge issuance limits
* Per-channel badge limits
* Per-user badge category limits
* Developer badge approval systems
* Badge cooldowns
* Badge audit trails

---

## Badge Review

Badges may be reviewed if they appear abusive, low-quality, or incorrectly classified.

Possible outcomes:

* Badge remains valid
* Badge downgraded
* Badge revoked
* Issuer warned
* Issuer limited
* Issuer suspended from badge issuance

---

## Badge Revocation

Badge revocation should be rare but possible.

Reasons may include:

* Fraud
* Exploits
* Incorrect issuance
* Developer mistake
* Abuse of issuer authority
* Proven manipulation

Revocation should emit an event in future versions.

---

## Relationship to Passport

Badges affect the Passport through badge points.

Current point model:

* Basic Badge = 1 point
* Event Badge = 2 points
* Completion Badge = 3 points

Badge points feed:

* XP
* Level progression
* Reputation progression

Badge points do not directly affect membership tier.

Membership is separate from reputation.

---

## Relationship to Reputation

Reputation is earned through badge quality and progression.

Reputation should not be purchasable.

A user should not be able to buy their way into reputation through low-quality badge issuance.

---

## Relationship to Membership

Membership tiers may unlock more features, but they should not automatically increase badge quality.

An Elite member should not receive higher badge value simply because they are Elite.

Badge quality depends on the achievement, not the payer.

---

## Future Move Modules

Current module:

* badge.move

Future modules may include:

* badge_issuer.move
* badge_registry.move
* badge_review.move
* badge_revocation.move

---

## Future Events

Possible future events:

* BadgeMinted
* BadgeRevoked
* BadgeReviewed
* BadgeIssuerApproved
* BadgeIssuerSuspended
* BadgeQualityUpdated

---

## Core Principle

Badges are the proof layer of Nami reputation.

They must remain meaningful, verifiable, and resistant to abuse.

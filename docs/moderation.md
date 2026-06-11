# Nami Moderation System

## Overview

The Nami Moderation System defines how warnings, restrictions, bans, appeals, and Passport penalties work across the ecosystem.

Moderation exists to protect communities while preserving fairness, transparency, privacy, and player voice.

Moderation should be firm enough to prevent abuse, but structured enough to avoid mob punishment.

---

## Moderation Levels

Nami moderation may include:

* Warning
* Temporary Mute
* Channel Ban
* Black Passport
* Permanent Restriction
* Appeal Review
* Jury Review

---

## Warning

Warnings are low-level moderation actions.

Used for:

* Minor spam
* Minor toxicity
* Off-topic disruption
* First-time guideline violations

Effect:

* Warning recorded
* No Passport death
* May affect future conduct review

Warnings should not immediately downgrade membership or reputation.

---

## Temporary Mute

Temporary mutes restrict chat participation for a limited time.

Used for:

* Repeated spam
* Heated arguments
* Short-term disruption
* Refusal to follow channel moderation

Effect:

* User may read
* User may not speak
* Duration-based restriction
* May be global or channel-specific

---

## Channel Ban

Channel bans are specific to a channel or hub.

Used for:

* Breaking channel-specific rules
* Harassing members in a channel
* Repeated disruption in one community

Effect:

* User loses access to that channel
* User may remain active elsewhere
* Does not automatically trigger Black Passport

Channel owners should have tools to protect their spaces without forcing global punishment.

---

## Black Passport

Black Passport is a global temporary penalty.

Public language:

"Passport downed. Respawning in..."

Used for:

* Serious harassment
* Scam attempts
* Bot behavior
* Ban evasion
* Repeated major violations
* Severe community abuse

Effect:

* User falls back to NPC-level benefits
* Boosts disabled
* Squad slots disabled
* Guild creation disabled
* Badge claiming disabled
* Prestige progress paused
* Gated chat access restricted

Black Passport must always have a duration unless escalated to permanent restriction.

---

## Permanent Restriction

Permanent restrictions are reserved for severe or repeated harm.

Used for:

* Fraud
* Threats
* Illegal content
* Coordinated bot networks
* Repeated severe abuse
* Malicious account recovery abuse

Permanent restrictions should require strong evidence and review.

---

## Appeals

Banned or restricted members may appeal moderation actions.

Appeals should support:

* Case review
* Evidence review
* Privacy protection
* Moderator decision history
* Optional anonymous jury review

Appeals should not expose private identities.

---

## Anonymous Jury Review

Nami may support anonymous jury-style appeal reviews for selected cases.

Purpose:

* Give Pro and Elite members a voice
* Create transparent community accountability
* Increase engagement
* Reduce perception of centralized moderation abuse

Jury eligibility may require:

* Pro or Elite membership
* Good standing
* No Black Passport history within a recent window
* Minimum reputation threshold
* No conflict of interest with the case

---

## Jury Privacy Rules

Jury cases should keep identities private.

The jury should see:

* Event timeline
* Rule violations
* Moderation actions
* Relevant evidence summaries
* Appeal statement
* Prior anonymized conduct history

The jury should not see:

* Wallet address
* Real name
* Linked social accounts
* Private messages unrelated to the case
* Personal identifying information

---

## Jury Output

Jury decisions may recommend:

* Uphold penalty
* Reduce penalty
* Extend penalty
* Remove penalty
* Escalate to manual review

Jury decisions should be advisory at first.

Final execution may remain with protocol moderation authority until the system matures.

---

## Community Voting

Community votes should never directly ban a user.

Community votes may:

* Flag behavior
* Trigger review
* Support appeal context
* Influence moderation priority

Community votes must not automatically execute punishment.

This prevents brigading, harassment, and popularity-based abuse.

---

## Moderation Events

Future events may include:

* WarningIssued
* MuteIssued
* ChannelBanIssued
* PassportDowned
* PassportRespawned
* AppealOpened
* AppealReviewed
* JuryAssigned
* JuryDecisionSubmitted

---

## Future Move Modules

Potential modules:

* moderation.move
* appeals.move
* jury.move

On-chain state should store:

* Penalty status
* Duration
* Appeal status
* Decision proof
* Public event trail

Off-chain systems should store:

* Evidence
* Chat logs
* Screenshots
* Moderator notes
* Private case files

---

## Core Principle

Moderation should protect the ecosystem without turning Nami into mob rule.

Community voice matters, but punishment must be reviewable, evidence-based, and resistant to abuse.

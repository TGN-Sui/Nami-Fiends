# Nami Trust System

## Overview

The Nami Trust System defines how the protocol evaluates reliability, safety, authenticity, contribution, and community standing.

Trust in Nami is not a single score.

Trust is a layered system made from multiple independent signals.

These signals include:

* Verification
* Membership
* Reputation
* Conduct Signal
* Moderation History
* Badge Quality
* Issuer Trust
* Channel Trust
* Guild Trust
* Squad Trust
* Recovery Trust
* Appeal Outcomes

Each signal serves a different purpose.

---

## Core Principle

Trust must be earned, verified, and protected.

Trust should never be fully purchasable.

Membership may unlock access, but membership does not automatically create trust.

---

# Trust Layers

Nami trust is built from several separate layers:

```text
Identity Trust
Verification Trust
Reputation Trust
Conduct Trust
Moderation Trust
Badge Trust
Issuer Trust
Channel Trust
Guild Trust
Squad Trust
Recovery Trust
```

These layers should remain separate so Nami does not accidentally confuse payment, personality, behavior, contribution, and punishment.

---

# Identity Trust

## Purpose

Identity Trust answers:

"Does this user have a persistent Nami identity?"

Identity Trust comes from:

* Identity object ownership
* Passport connection
* Account age
* Linked verification sources
* Recovery history
* Consistent ownership

Identity Trust is the foundation layer.

---

## Identity Risk

Identity risk may increase when:

* Ownership changes unexpectedly
* Recovery is triggered
* Linked accounts are removed
* Multiple identities appear tied to the same external account
* Suspicious wallet behavior appears

Identity risk should not automatically punish a user, but it may trigger review or additional verification.

---

# Verification Trust

## Purpose

Verification Trust answers:

"Has this user proven enough humanity or authenticity?"

Verification Trust helps reduce:

* Bots
* Sybil accounts
* Reward farming
* Boost manipulation
* Badge farming
* Fake guild creation
* Fake channel participation

---

## Verification Sources

Potential verification sources:

* zkLogin
* Sui wallet ownership
* X.com verification
* SuiNS
* Steam
* Epic Games
* Email
* Future proof-of-humanity systems
* Future privacy-preserving proof systems

Verification should minimize unnecessary exposure of private identity data.

---

## Verification Boundaries

Verification does not mean:

* High reputation
* Good conduct
* Guild authority
* Badge issuer authority
* Immunity from moderation

Verification only proves authenticity or humanity.

---

# Membership Trust

## Purpose

Membership controls access, not earned trust.

Membership tiers:

* NPC
* Adventurer
* Pro
* Elite

Membership may increase system confidence because paid or verified users are less likely to be disposable spam accounts.

However, membership does not equal good behavior.

---

## Membership Boundaries

Membership must not:

* Purchase reputation
* Override moderation
* Automatically grant badge authority
* Automatically grant guild authority
* Automatically grant jury authority without other requirements
* Prevent Black Passport restrictions

An Elite user can still be restricted.

A Pro user can still be unsafe.

An NPC user can still become valuable over time.

---

# Reputation Trust

## Purpose

Reputation Trust answers:

"What has this user earned through meaningful activity?"

Current reputation ranks:

* Newbie
* Gamester
* Goblin
* Goonie
* Fiend

Reputation is based on:

* Badge points
* XP
* Level progression
* Meaningful contribution
* Future participation signals

---

## Reputation Boundaries

Reputation should not be directly purchasable.

Reputation should not be farmable through low-quality badges.

Reputation should not be granted just for idling, opening a game, buying cosmetics, or sending spam messages.

Reputation should reflect earned contribution.

---

# Conduct Trust

## Purpose

Conduct Trust answers:

"What kind of interaction should others expect from this user right now?"

Conduct Signal values:

* Green
* Orange
* Red
* Black

---

## Green Signal

Friendly, casual, low-conflict.

Generally safe for most spaces.

---

## Orange Signal

Competitive but respectful.

Good for serious or focused communities.

---

## Red Signal

High-intensity, PvP-heavy, trash-talk-tolerant.

Red is not punishment.

Red helps users find compatible spaces.

---

## Black Signal

Moderation penalty state.

Public language:

```text
Passport downed. Respawning in...
```

Black Signal temporarily reduces the user to NPC-equivalent benefits until the restriction expires or is resolved.

---

## Conduct Boundaries

Conduct is not reputation.

Conduct is not membership.

Red should not be treated as bad behavior by default.

Black is the only punishment signal.

---

# Moderation Trust

## Purpose

Moderation Trust answers:

"Has this user recently violated community or protocol rules?"

Moderation history may include:

* Warnings
* Mutes
* Channel bans
* Black Passport actions
* Permanent restrictions
* Appeal outcomes

---

## Moderation Impact

Moderation actions may affect:

* Chat access
* Boost eligibility
* Squad eligibility
* Guild creation
* Jury eligibility
* Badge claiming
* Discovery influence
* Conduct Signal

---

## Moderation Boundaries

Moderation should be evidence-based.

Community votes should not directly punish users.

Reports and votes may trigger review, but penalties should require rules, evidence, and authority.

---

# Badge Trust

## Purpose

Badge Trust answers:

"Do this user's badges represent meaningful achievement?"

Badge trust depends on:

* Badge type
* Badge quality
* Issuer trust
* Achievement difficulty
* Completion proof
* Farming resistance
* Revocation history

---

## Badge Quality

Current badge types:

* Basic Badge
* Event Badge
* Completion Badge

Completion Badges should represent meaningful verified completion.

Starting a game should not issue a Completion Badge.

Opening a game should not issue a Completion Badge.

Joining a channel should not issue a Completion Badge.

---

## Badge Abuse Risk

Badge Trust decreases when:

* Badges are issued too easily
* Completion Badges are issued for trivial actions
* Issuers farm reputation
* Users collude with issuers
* Badge activity appears automated
* Badge revocations increase

Badge systems must protect reputation integrity.

---

# Issuer Trust

## Purpose

Issuer Trust answers:

"Can this channel, guild, developer, or event organizer responsibly issue badges?"

Potential issuer types:

* Nami Official
* Verified Game Developer
* Verified Channel
* Approved Guild
* Approved Event Organizer
* Partner Community

---

## Issuer Permissions

Issuer Trust may control:

* Allowed badge types
* Badge issuance limits
* Completion Badge authority
* Review requirements
* Cooldowns
* Revocation risk
* Issuer suspension

High-trust issuers may receive stronger badge permissions.

Low-trust or new issuers should be limited.

---

# Channel Trust

## Purpose

Channel Trust answers:

"Is this channel safe, active, useful, and authentic?"

Channel Trust may depend on:

* Verification status
* Developer ownership
* Moderation health
* Activity quality
* Badge quality
* User retention
* Conduct mix
* Report history
* Appeal outcomes
* Spam levels

---

## Channel Trust and NPC Chat

Verified channels may decide whether NPC users can chat.

Core toggle:

```text
Allow NPC Chat: Yes / No
```

Disabling NPC chat can improve channel safety during spam waves.

---

# Guild Trust

## Purpose

Guild Trust answers:

"Is this guild a reliable community?"

Guild Trust may depend on:

* Founder verification
* Member reputation
* Guild activity
* Moderation health
* Event quality
* Badge quality
* Retention
* Abuse history
* Governance history

---

## Guild Boundaries

Guild leaders should manage their guild spaces.

Guild leaders should not override global Nami moderation.

Guild status should not automatically grant badge authority without approval.

---

# Squad Trust

## Purpose

Squad Trust answers:

"Who personally vouches for this user?"

Squads are small trust networks.

Squad sponsorship may help onboard unverified or financially limited users.

---

## Squad Sponsorship Boundaries

Sponsored users should not automatically receive:

* Boosts
* Guild creation rights
* Puzzle pieces
* Full reward claims
* Badge issuer authority

Sponsorship is a trust assist, not full verification.

---

# Jury Trust

## Purpose

Jury Trust answers:

"Can this user participate fairly in appeal review?"

Future jury eligibility may require:

* Pro or Elite membership
* Active membership
* Good standing
* No active Black Signal
* No recent severe violations
* Minimum reputation
* No conflict of interest

---

## Jury Privacy

Juries should review anonymized case events.

Juries should not see:

* Wallet addresses
* Real names
* Email addresses
* Linked social accounts
* Private unrelated messages
* Personal identifying information

Jury decisions may begin as advisory before becoming protocol-binding.

---

# Recovery Trust

## Purpose

Recovery Trust answers:

"Can this user safely recover their identity?"

Recovery Trust may use:

* zkLogin proof
* Linked social accounts
* Linked game accounts
* Email recovery
* Wallet ownership
* Squad support
* Guild support
* Manual review

---

## Recovery Risk

Recovery systems must prevent:

* Account theft
* Fake recovery claims
* Social engineering
* Compromised guardian abuse
* Malicious squad or guild claims

Recovery should use multiple signals when possible.

---

# Trust and Discovery

Discovery may use trust signals to rank channels, guilds, events, and communities.

Discovery may consider:

* Boosts
* Reputation
* Badge quality
* Conduct health
* Channel trust
* Guild trust
* Developer verification
* Moderation health
* Engagement quality

Boosts should influence discovery but not fully control it.

---

# Trust and Access Control

Access checks may eventually consider:

```text
Membership tier
+ Verification status
+ Conduct Signal
+ Moderation status
+ Membership expiration
+ Reputation rank
+ Badge ownership
+ Channel rules
+ Guild roles
+ Squad sponsorship
```

Raw membership tier alone will not be enough long-term.

Example:

A user may have Elite membership but Black Signal.

In that case, effective benefits should fall back to NPC-equivalent restrictions until respawn.

---

# Trust Events

Future trust-related events may include:

* IdentityVerified
* VerificationLevelUpdated
* ConductSignalUpdated
* PassportDowned
* PassportRespawned
* WarningIssued
* BadgeIssuerApproved
* BadgeIssuerSuspended
* BadgeRevoked
* AppealResolved
* JuryDecisionSubmitted
* ChannelTrustUpdated
* GuildTrustUpdated

---

# Future Trust Modules

Potential future modules:

* verification.move
* conduct.move
* moderation.move
* badge_issuer.move
* channel_trust.move
* guild_trust.move
* jury.move
* recovery.move

Trust computation may be partly off-chain.

On-chain should anchor important states, proofs, and events.

---

# Anti-Abuse Principles

The Trust System must resist:

* Sybil attacks
* Bot farming
* Badge farming
* Boost manipulation
* Fake guilds
* Fake channels
* Report brigading
* Jury manipulation
* Recovery fraud
* Pay-to-reputation behavior

---

# Core Principles

Trust must be layered.

Verification proves authenticity.

Reputation proves contribution.

Membership controls access.

Conduct communicates interaction state.

Moderation protects communities.

Badges prove meaningful activity.

Community voice matters, but punishment must not be mob-driven.

Nami trust should feel fair, gamer-native, and difficult to fake.

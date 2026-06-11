# Nami Access Control

## Overview

Access Control defines what users, channels, guilds, squads, developers, and moderators are allowed to do within the Nami ecosystem.

Nami access is determined by multiple independent layers:

* Membership Tier
* Reputation Rank
* Passport Signal
* Verification Status
* Channel Rules
* Guild Roles
* Squad Relationships
* Moderation Status
* Badge Issuer Authority

These systems must remain separate.

Membership controls access.

Reputation reflects contribution.

Passport Signal communicates conduct and interaction style.

Moderation restricts behavior when necessary.

---

## Core Identity Layers

### Membership Tier

Membership controls access to features and benefits.

Current tiers:

* NPC
* Adventurer
* Pro
* Elite

---

### Reputation Rank

Reputation reflects earned contribution and progression.

Current ranks:

* Newbie
* Gamester
* Goblin
* Goonie
* Fiend

Reputation cannot be purchased.

---

### Passport Signal

Passport Signal communicates public conduct and interaction expectations.

Current signals:

* Green
* Orange
* Red
* Black

Black is a moderation penalty state.

---

## Membership Tiers

### NPC

NPC is the default free and unverified state.

NPC users may:

* Create an identity
* Own a Passport
* Select an archetype
* View public areas
* Participate where channels allow NPC chat
* Earn limited progression if allowed by future rules

NPC users may not:

* Use boosts
* Create guilds
* Sponsor squad members
* Issue badges
* Access verified-only channels
* Access Pro or Elite gated features
* Influence discovery
* Serve on juries
* Claim premium rewards

NPC is the baseline sandbox tier.

---

### Adventurer

Adventurer represents verified human/basic access.

A user may become Adventurer through:

* Approved verification
* Basic membership
* X.com verification carryover
* Future approved identity provider

Adventurer users may:

* Access verified channels
* Use 1 boost per cycle
* Display basic verified status
* Claim eligible basic rewards
* Participate in broader community systems

Adventurer users may not:

* Sponsor squad members
* Create guilds by default
* Serve on appeal juries by default
* Access Pro or Elite cosmetic capacity
* Issue official badges

---

### Pro

Pro represents full-access supporter membership.

Pro users may:

* Use 6 boosts per cycle
* Access Pro features
* Gain limited squad sponsorship slots
* Access expanded customization
* Become eligible for anonymous jury pools
* Participate in higher-trust discovery signals

Pro users may not:

* Abuse discovery influence
* Issue badges
* Override moderation restrictions

---

### Elite

Elite represents premium supporter membership.

Elite users may:

* Use 8 boosts per cycle
* Access premium customization
* Gain expanded squad sponsorship slots
* Become eligible for anonymous jury pools
* Participate in premium community systems
* Display advanced cosmetic identity

Elite users may not:

* Bypass conduct penalties
* Override moderation restrictions
* Purchase reputation
* Gain badge issuer authority

Elite provides stronger access and cosmetics, not immunity.

---

## Membership Expiration

Future versions will support tier expiration and renewal.

Planned rules:

* Pro and Elite memberships may expire
* Expired memberships lose active benefits
* Expired users fall back to Adventurer if still verified
* Expired users fall back to NPC if no valid verification remains
* Expiration should disable boosts, squad slots, premium cosmetics, and jury eligibility

Membership expiration must not delete reputation, badges, or Passport history.

---

## Passport Signal Access Effects

### Green Signal

Green users are in normal standing.

No restrictions.

---

### Orange Signal

Orange users are in normal standing.

No restrictions.

Orange communicates competitive but respectful interaction style.

---

### Red Signal

Red users are in normal standing.

No restrictions by default.

Red communicates high-intensity gameplay preference.

Red must not be treated as a punishment state.

---

### Black Signal

Black Signal represents a moderation penalty.

During Black Signal status, the user temporarily falls back to NPC-equivalent benefits.

Black Signal restrictions may include:

* No boosts
* No squad sponsorship
* No guild creation
* No badge claiming
* No prestige progress
* No jury eligibility
* Restricted chat access
* No discovery influence
* No verified gated channel access

Public UI language:

"Passport downed. Respawning in..."

Black Signal must have an expiration unless escalated to permanent restriction.

---

## Chat Access Rules

Channels may define who can speak.

Possible channel modes:

* Public read
* Public chat
* NPC chat allowed
* NPC chat disabled
* Adventurer+ chat
* Pro+ chat
* Elite-only chat
* Reputation-gated chat
* Badge-gated chat
* Guild-gated chat
* Squad-gated chat

Verified channels should have a simple toggle:

Allow NPC Chat: Yes / No

If NPC chat is disabled, NPC users may still read if the channel allows public read.

This helps reduce bot spam while preserving discoverability.

---

## Channel Owner Permissions

Verified channel owners may:

* Configure chat access rules
* Toggle NPC chat
* Create channel-specific rules
* Host events
* Request badge issuer authority
* Moderate their own channel
* Ban users from their channel

Channel owners may not:

* Globally ban users
* Assign Black Passport directly
* Issue completion badges without badge authority
* Modify Passport reputation directly
* Override Nami global moderation

---

## Badge Issuer Permissions

Badge issuance should require authorization.

Possible issuer classes:

* Nami Official
* Verified Game Developer
* Verified Channel
* Approved Guild
* Approved Event Organizer
* Partner Community

Badge issuer permissions may define:

* Allowed badge types
* Issuance limits
* Review requirements
* Revocation authority
* Cooldowns
* Issuer reputation

Completion Badges should require higher issuer authority than Basic Badges.

Starting a game, launching a game, or joining a channel must never qualify as a Completion Badge.

---

## Boost Permissions

Boost access is based on active membership tier.

Current boost model:

* NPC: 0 boosts
* Adventurer: 2 boost
* Pro: 6 boosts
* Elite: 8 boosts

Black Signal users have boost access disabled regardless of tier.

Boosts influence discovery but do not grant moderation, governance, or ownership rights.

---

## Squad Permissions

Future squad slot model:

* NPC: 0 slots
* Adventurer: 0 slots
* Pro: limited slots
* Elite: expanded slots

Squad sponsorship helps onboard trusted users but should not bypass core restrictions.

Sponsored users may receive limited access depending on channel rules.

Sponsored users should not automatically receive:

* Boosts
* Guild creation rights
* Puzzle pieces
* Full reward claims
* Badge issuer permissions

---

## Guild Permissions

Guild creation should require trust and verification.

Possible future requirements:

* Adventurer or higher
* Reputation threshold
* At least 3 verified founding members
* No active Black Signal
* No recent severe moderation history

Guild leaders may manage guild membership and guild channels.

Guild leaders may not bypass global Nami moderation.

---

## Jury Eligibility

Anonymous jury review is a future feature for appeal cases.

Potential eligibility requirements:

* Pro or Elite membership
* Active membership
* Good standing
* No active Black Signal
* No recent major violations
* Minimum reputation threshold
* No conflict of interest with the case

Jurors should review anonymized case events, not private identity information.

Jury decisions may begin as advisory before becoming protocol-binding.

---

## Moderation Permissions

Moderation authority may include:

* Channel moderators
* Guild moderators
* Nami moderators
* Protocol-level moderators
* Future jury review systems

Moderation actions may include:

* Warning
* Mute
* Channel ban
* Black Passport
* Permanent restriction
* Appeal review

Channel moderators should only control their own spaces.

Global penalties require higher authority.

---

## Customization Access

Customization may be unlocked by:

* Membership
* Reputation
* Badges
* Events
* Guild achievements
* Squad participation
* Prestige
* Puzzle completion
* Developer channel rewards

Membership may increase display capacity.

Reputation and badges should unlock earned cosmetics.

Premium cosmetics should not replace earned achievement.

---

## Recovery Access

Recovery actions should require strong proof.

Possible recovery sources:

* zkLogin recovery
* Linked account verification
* Email recovery code
* Squad or guild support
* Manual review

Recovery must never expose private user information to public juries or communities.

---

## Access Control Principles

Access can be purchased.

Trust must be earned.

Reputation cannot be bought.

Conduct penalties override benefits.

Community votes may trigger review but must not directly punish users.

Channel owners can protect their spaces but cannot override global protocol rules.

Membership should enhance Nami without creating pay-to-win reputation.

# Nami Event Registry

## Overview

Events are the public activity trail of the Nami Protocol.

Events allow apps, indexers, dashboards, moderation tools, discovery engines, and SDKs to understand what happened without requiring every system to read full object state manually.

Events should be:

* Lightweight
* Auditable
* Indexable
* Privacy-conscious
* Easy for backend services to consume

Events should not expose unnecessary private user data.

---

## Core Principle

On-chain objects store state.

Events announce changes.

Off-chain services index events and build user-facing experiences.

---

# Identity Events

## IdentityCreated

Emitted when a new Identity is created.

Fields:

* identity_id
* owner

Purpose:

* Track new identity creation
* Initialize profile indexing
* Connect future Passport creation flows

---

## IdentityVerified

Planned.

Emitted when an Identity receives verification.

Fields:

* identity_id
* verification_source
* verification_level

Purpose:

* Track human verification
* Support NPC to Adventurer transition
* Support trust and anti-sybil systems

---

# Passport Events

## PassportCreated

Emitted when a Passport is created.

Fields:

* passport_id
* identity_id

Purpose:

* Track Passport creation
* Initialize progression indexing
* Connect user profile and Passport systems

---

## XPAdded

Emitted when XP is applied to a Passport.

Fields:

* passport_id
* amount
* total_xp
* level
* level_progress

Purpose:

* Track progression
* Update frontend level displays
* Support analytics
* Support seasonal progression tracking

---

## BadgePointsAdded

Emitted when badge points are applied to a Passport.

Fields:

* passport_id
* amount
* total
* reputation

Purpose:

* Track badge-powered progression
* Update reputation displays
* Support anti-farming analysis

---

## TierUpgraded

Emitted when a Passport membership/access tier changes.

Fields:

* passport_id
* old_tier
* new_tier

Purpose:

* Track NPC to Adventurer verification
* Track Pro and Elite upgrades
* Support access-control updates
* Support membership analytics

---

## PassportSeasonReset

Planned.

Emitted when seasonal level progression resets.

Fields:

* passport_id
* previous_level
* previous_xp
* previous_reputation
* season_id

Purpose:

* Support 6-month progression seasons
* Preserve historical achievement
* Prepare future Prestige systems

---

## PrestigeEarned

Planned.

Emitted when a Level 100 user earns Prestige progress or a Prestige title.

Fields:

* passport_id
* prestige_points
* prestige_title

Purpose:

* Track post-Level-100 progression
* Support rare title unlocks
* Support Prestige cosmetics

---

# Badge Events

## BadgeMinted

Emitted when a badge is issued.

Fields:

* owner
* badge_type
* points

Purpose:

* Track badge creation
* Update profile badge displays
* Support Passport progression
* Support badge analytics

---

## BadgeRevoked

Planned.

Emitted when a badge is revoked.

Fields:

* badge_id
* owner
* reason_code

Purpose:

* Support fraud correction
* Support mistaken issuance correction
* Support badge quality enforcement

---

## BadgeReviewed

Planned.

Emitted when a badge is reviewed by moderation or protocol authority.

Fields:

* badge_id
* reviewer
* result

Purpose:

* Support badge quality audits
* Support issuer accountability

---

## BadgeIssuerApproved

Planned.

Emitted when a channel, guild, developer, or partner receives badge issuance authority.

Fields:

* issuer_id
* issuer_type
* approved_badge_types

Purpose:

* Track trusted badge issuers
* Support developer and channel badge systems

---

## BadgeIssuerSuspended

Planned.

Emitted when an issuer loses badge issuance authority.

Fields:

* issuer_id
* reason_code

Purpose:

* Prevent badge farming
* Penalize low-quality badge issuance
* Protect reputation integrity

---

# Boost Events

## BoostUsed

Emitted when a user applies a boost to a channel.

Fields:

* owner
* channel_id
* power
* tier
* week_id

Purpose:

* Track discovery signals
* Support weekly boost cycles
* Support channel ranking systems
* Support anti-abuse analysis

---

## BoostCycleReset

Planned.

Emitted when a weekly boost cycle resets.

Fields:

* week_id
* reset_at_ms

Purpose:

* Support weekly discovery recalculation
* Reset boost influence windows

---

# Conduct Events

## ConductSignalUpdated

Planned.

Emitted when a Passport Signal changes.

Fields:

* passport_id
* old_signal
* new_signal
* reason_code
* expires_at_ms

Purpose:

* Track Green, Orange, Red, and Black signal changes
* Support public conduct displays
* Support moderation transparency

---

## PassportDowned

Planned.

Emitted when a Passport enters Black Signal status.

Fields:

* passport_id
* reason_code
* respawn_at_ms

Purpose:

* Track temporary global restrictions
* Support public "Passport downed" UI
* Apply temporary NPC-equivalent benefits

---

## PassportRespawned

Planned.

Emitted when a Black Passport restriction expires or is lifted.

Fields:

* passport_id
* restored_tier
* restored_at_ms

Purpose:

* Restore access
* Update public Passport Signal
* Support moderation audit trails

---

# Moderation Events

## WarningIssued

Planned.

Fields:

* target_passport_id
* moderator_id
* reason_code

Purpose:

* Track minor moderation actions
* Support future escalation logic

---

## MuteIssued

Planned.

Fields:

* target_passport_id
* scope
* expires_at_ms
* reason_code

Purpose:

* Track temporary chat restrictions
* Support global or channel-specific mutes

---

## ChannelBanIssued

Planned.

Fields:

* target_passport_id
* channel_id
* expires_at_ms
* reason_code

Purpose:

* Track channel-specific bans
* Give channel owners moderation tools
* Avoid unnecessary global penalties

---

## AppealOpened

Planned.

Fields:

* case_id
* target_passport_id
* penalty_type

Purpose:

* Track user appeals
* Initialize appeal review workflows

---

## AppealResolved

Planned.

Fields:

* case_id
* result
* resolved_at_ms

Purpose:

* Track final appeal outcomes
* Support transparency and moderation accountability

---

# Jury Events

## JuryAssigned

Planned.

Fields:

* case_id
* jury_group_id
* juror_count

Purpose:

* Track anonymous jury review assignment
* Support Pro and Elite community participation

---

## JuryDecisionSubmitted

Planned.

Fields:

* case_id
* decision
* juror_group_id

Purpose:

* Track anonymous community review outcomes
* Preserve case privacy while allowing public accountability

---

# Channel Events

## ChannelAccessRuleUpdated

Planned.

Fields:

* channel_id
* allow_npc_chat
* minimum_tier
* minimum_reputation

Purpose:

* Track channel chat access rules
* Allow verified channels to control NPC chat access
* Reduce spam and bot risk

---

## ChannelBadgePolicyUpdated

Planned.

Fields:

* channel_id
* allowed_badge_types
* issuer_status

Purpose:

* Track badge issuance permissions
* Support badge quality standards

---

# Customization Events

## CustomizationUnlocked

Planned.

Fields:

* passport_id
* customization_id
* source_type

Purpose:

* Track earned cosmetics
* Support profile and Passport customization

---

## CustomizationEquipped

Planned.

Fields:

* passport_id
* customization_id
* slot

Purpose:

* Track selected profile and chat cosmetics
* Support UI rendering

---

## TitleEquipped

Planned.

Fields:

* passport_id
* title_id

Purpose:

* Track earned title display

---

## AvatarUpdated

Planned.

Fields:

* passport_id
* avatar_config_id

Purpose:

* Track 2D avatar updates
* Support VTuber-style profile identity

---

# Squad Events

## SquadCreated

Planned.

Fields:

* squad_id
* leader_passport_id

Purpose:

* Track squad creation
* Support squad discovery and profile display

---

## SquadMemberSponsored

Planned.

Fields:

* squad_id
* sponsor_passport_id
* sponsored_passport_id
* expires_at_ms

Purpose:

* Track sponsorship relationships
* Support weekly squad slot renewal

---

## SquadSponsorshipExpired

Planned.

Fields:

* squad_id
* sponsored_passport_id

Purpose:

* Track expired sponsorships
* Reset temporary access benefits

---

# Guild Events

## GuildCreated

Planned.

Fields:

* guild_id
* creator_passport_id

Purpose:

* Track guild creation
* Support guild discovery and ownership indexing

---

## GuildMemberJoined

Planned.

Fields:

* guild_id
* passport_id

Purpose:

* Track guild membership

---

## GuildRoleUpdated

Planned.

Fields:

* guild_id
* passport_id
* role

Purpose:

* Track leadership and permissions

---

# Recovery Events

## RecoveryRequested

Planned.

Fields:

* case_id
* identity_id

Purpose:

* Track recovery requests
* Start recovery workflows

---

## RecoveryApproved

Planned.

Fields:

* case_id
* approval_source

Purpose:

* Track recovery approvals
* Support social recovery and provider recovery

---

## RecoveryCompleted

Planned.

Fields:

* identity_id
* new_owner

Purpose:

* Track final recovery execution
* Support user account restoration

---

# Event Privacy Rules

Events should avoid exposing:

* Real names
* Private emails
* Linked social handles
* Private chat messages
* Wallet addresses when privacy-preserving alternatives exist
* Sensitive evidence from moderation cases

Events may expose:

* Object IDs
* Case IDs
* Reason codes
* Public status changes
* Time windows
* Outcome states

---

# Event Design Rules

Events should be:

* Small
* Stable
* Version-aware
* Easy to index
* Clear in purpose

Events should not duplicate full object state unless necessary.

Events should not include private evidence.

Events should support future SDKs, dashboards, moderation tools, and discovery engines.

---

## Core Principle

Events are the heartbeat of Nami.

They make the protocol observable, indexable, and transparent without forcing every application to directly inspect every object.

# Nami Resilience System

## Overview

The Nami Resilience System defines how the protocol should continue operating during outages, degraded services, indexing delays, moderation emergencies, provider failures, and recovery incidents.

Nami should be designed so that no single service outage can fully break the user experience.

The protocol should remain usable, understandable, and recoverable even when parts of the system are temporarily unavailable.

---

## Core Principle

Nami should fail gracefully.

If one layer is unavailable, other layers should continue operating where possible.

Critical systems should have fallback behavior.

Users should understand what is unavailable and what remains safe.

---

# Resilience Goals

Nami resilience should protect:

* Identity ownership
* Passport continuity
* Badge history
* Reputation history
* Membership access
* Boost records
* Moderation state
* Recovery paths
* Chat availability
* Discovery integrity
* Developer channel continuity

---

# Critical System Layers

Nami depends on multiple layers:

* Sui Move contracts
* Sui RPC access
* Event indexing
* Backend services
* Chat services
* Discovery services
* Moderation services
* Verification providers
* Storage providers
* Frontend applications
* SDK integrations

Each layer should have a defined failure mode.

---

# On-Chain Resilience

## Sui Move State

Important identity and proof state should be anchored on-chain.

This includes:

* Identity objects
* Passport objects
* Badge objects
* Boost objects
* Tier upgrade events
* Badge events
* Boost events
* Future conduct status
* Future moderation status
* Future recovery proofs

If frontend or backend services fail, on-chain state should remain available once Sui access is restored.

---

## RPC Failure

If a Sui RPC provider is unavailable, Nami should support fallback RPC endpoints.

Possible fallback behavior:

* Switch RPC provider
* Display read-only cached profile data
* Queue non-critical user actions
* Retry failed reads
* Warn users before submitting transactions

Critical user-facing message:

"Network access is temporarily degraded. Your on-chain identity and Passport remain safe."

---

## Transaction Failure

If a transaction fails, the user should receive a clear reason.

Examples:

* Insufficient gas
* Invalid access tier
* Expired membership
* Restricted Passport status
* Network timeout
* Object already used
* Permission denied

The frontend should avoid vague errors like:

"Something went wrong."

---

# Event Indexer Resilience

## Purpose

Event indexers power:

* Profile timelines
* Badge history
* Boost rankings
* Discovery
* Moderation dashboards
* Analytics
* Notifications

If the indexer is delayed, on-chain objects may still be correct while UI data appears stale.

---

## Indexer Delay

If event indexing is delayed, Nami should:

* Show last indexed timestamp
* Avoid displaying stale data as final
* Allow manual refresh
* Continue reading critical object state directly from Sui when possible
* Reprocess missed events after recovery

User-facing language:

"Some activity may be delayed while indexing catches up."

---

## Indexer Recovery

Indexer recovery should support:

* Replaying events from checkpoints
* Detecting missing events
* Rebuilding derived views
* Validating event order
* Reconciling object state with indexed state

Derived data should be rebuildable from on-chain events where possible.

---

# Chat Resilience

## Purpose

Nami chat should be fast and reliable.

Chat messages should primarily live off-chain for speed and scale.

Sui should anchor:

* Identity
* Access
* Membership
* Reputation
* Badges
* Conduct status
* Channel permissions

---

## Chat Provider Outage

If the primary chat provider fails, Nami should support fallback behavior.

Possible fallback options:

* Read-only mode
* Announcement-only mode
* Backup messaging provider
* Sui-based emergency announcement channel
* Cached channel history
* Delayed message queue

Critical communication should continue even if normal chat is unavailable.

---

## Emergency Announcement Mode

Nami should support an emergency announcement mode for:

* Platform outages
* Security incidents
* Major moderation events
* Developer hub notices
* Maintenance windows
* Recovery instructions

Emergency announcements should be available even when normal chat is degraded.

---

## Messaging SDK Fallback

Nami may use Sui-native messaging tools or SDKs as a fallback layer if the primary messaging system experiences outages.

Fallback messaging should be reserved for:

* Critical announcements
* System alerts
* Recovery updates
* Security notices
* Developer emergency communication

Normal high-volume chat should remain off-chain for scalability.

---

# Discovery Resilience

## Purpose

Discovery helps users find quality communities.

Discovery depends on indexed events, boost cycles, moderation health, badge quality, and backend ranking.

If discovery systems fail, users should still be able to access known channels directly.

---

## Discovery Failure

If discovery ranking is unavailable, Nami should:

* Show cached rankings
* Mark rankings as delayed
* Allow direct channel access
* Allow search fallback
* Avoid recalculating rankings from incomplete data
* Preserve current cycle data until recovery

User-facing language:

"Discovery rankings are temporarily delayed. Direct channel access remains available."

---

## Boost Cycle Failure

If a weekly boost cycle fails to process:

* Do not lose boost history
* Do not double-count boosts
* Do not reset early
* Do not roll over incorrectly
* Freeze affected rankings if necessary
* Reprocess from BoostUsed events

Boost cycles should be deterministic and replayable.

---

# Moderation Resilience

## Purpose

Moderation must remain functional during system degradation.

Moderation protects communities from abuse, spam, harassment, scams, and bot activity.

---

## Moderation Service Outage

If moderation tools are partially unavailable:

* Channel owners should retain basic moderation controls
* Emergency global restrictions should remain possible
* Existing Black Passport restrictions should remain enforceable
* Appeals may be delayed but should not disappear
* Evidence should not be lost

---

## Abuse Spike Mode

Nami should support stricter temporary controls during abuse spikes.

Examples:

* Temporarily disable NPC chat globally
* Temporarily require Adventurer+ chat
* Temporarily slow message posting
* Temporarily restrict new account actions
* Temporarily pause badge claiming
* Temporarily pause boost usage

These should be emergency controls, not normal operating mode.

---

## Black Passport Continuity

Black Passport restrictions should remain enforceable even if frontend services are degraded.

A Black Passport should continue to mean:

"Passport downed. Respawning in..."

Restrictions should remain active until expiration or appeal resolution.

---

# Appeals and Jury Resilience

## Purpose

Appeals must remain fair even during outages or delays.

A user should not lose their ability to appeal because a backend service failed.

---

## Appeal Delay

If appeal systems are delayed:

* Case state should remain preserved
* Submission time should be recorded
* Deadlines may be paused or extended
* Users should see current appeal status
* Jury assignment should wait until systems are stable

---

## Jury Failure

If jury selection or review fails:

* Case should return to moderation review
* No automatic penalty escalation should occur
* Juror inactivity should not punish the appellant
* Replacement jury assignment may occur

Jury systems should be advisory at first until reliability is proven.

---

# Verification Resilience

## Purpose

Verification supports NPC to Adventurer transition and future access systems.

Verification providers may fail or become unavailable.

---

## Verification Provider Outage

If a provider is unavailable:

* Do not delete existing verification immediately
* Pause new verification through that provider
* Offer alternate verification paths where possible
* Keep user Passport history intact
* Clearly mark verification as delayed

Examples of providers:

* zkLogin
* X.com
* Steam
* Epic Games
* SuiNS
* Email provider
* Future proof-of-humanity provider

---

## Verification Expiration

If verification expires due to provider failure, Nami should avoid instant harsh downgrades unless abuse is detected.

Possible behavior:

* Grace period
* Re-verification prompt
* Temporary restricted state
* Manual review path

Verification expiration should not delete reputation, badges, or Passport history.

---

# Membership Resilience

## Purpose

Membership controls access to Pro and Elite benefits.

Membership systems must handle failed renewals, provider outages, expired payments, and grace periods.

---

## Renewal Failure

If renewal fails:

* Notify the user
* Preserve Passport history
* Preserve reputation
* Preserve badges
* Disable active benefits only after policy-defined expiration
* Do not delete earned cosmetics
* Restrict premium display capacity if needed

---

## Subscription Provider Outage

If a payment or subscription provider fails:

* Do not immediately punish active members
* Use cached active status for a limited grace period
* Disable new upgrades if necessary
* Reconcile status after provider recovery

---

# Customization Resilience

## Purpose

Customization controls profile expression, Passport themes, avatars, frames, overlays, and titles.

Customization should degrade gracefully.

---

## Customization Service Failure

If customization services fail:

* Default profile display should still work
* Passport core data should still load
* Equipped cosmetics may show cached state
* Missing assets should fall back to default visuals
* Rare unlock proofs should remain safe on-chain

Customization failures should never block core identity access.

---

# Storage Resilience

## Purpose

Nami may use decentralized or external storage for rich media and metadata.

Potential storage includes:

* Walrus
* CDN mirrors
* Backend asset storage
* Cached frontend assets

---

## Storage Failure

If media storage is unavailable:

* Profile should fall back to default assets
* Avatar should fall back to base avatar
* Badge metadata should show minimal information
* Appeal evidence should remain protected
* Uploads should be paused until stable

Large files should not be required for basic Passport functionality.

---

# SDK Resilience

## Purpose

The Nami SDK should help external games and websites handle outages gracefully.

---

## SDK Failure Modes

SDK should expose clear states:

* connected
* degraded
* read_only
* offline
* indexing_delayed
* chat_unavailable
* transaction_pending
* transaction_failed

Developers should be able to decide how their game or site reacts to each state.

---

## SDK Retry Behavior

SDK should support:

* Retry with backoff
* Provider failover
* Cached reads
* Safe transaction resubmission rules
* Clear error codes
* Event subscription recovery

SDK should avoid duplicate transaction submissions.

---

# Frontend Resilience

## Purpose

The frontend should explain degraded states clearly.

---

## Frontend Requirements

Frontend should show:

* Network status
* Indexer status
* Chat status
* Discovery status
* Transaction status
* Maintenance notices
* Appeal status
* Membership expiration warnings

Users should always know whether a problem affects:

* Their account
* The network
* Chat
* Discovery
* Moderation
* Payments
* Verification

---

# Data Recovery

## Purpose

Nami should be able to recover derived data from authoritative sources.

---

## Rebuildable Data

The following should be rebuildable:

* Badge history from events and objects
* Boost history from events
* Passport timeline from events
* Discovery rankings from indexed inputs
* Moderation timeline from moderation events
* Membership history from tier and renewal events

---

## Non-Rebuildable Data

Some data may not be fully rebuildable if not preserved carefully:

* Private moderation evidence
* Private appeal evidence
* Chat messages
* Uploaded media
* Avatar configuration
* Off-chain profile settings

These systems need backups, encryption, and retention policies.

---

# Security Incident Response

## Purpose

Nami should have a clear response path for security incidents.

Examples:

* Contract exploit
* Badge issuer abuse
* Boost farming attack
* Bot wave
* Compromised moderator
* Verification provider abuse
* Recovery abuse
* Chat spam attack

---

## Incident Response Steps

Basic response flow:

1. Detect incident
2. Limit damage
3. Preserve evidence
4. Notify affected users
5. Pause vulnerable systems if needed
6. Apply patches or mitigations
7. Reconcile state
8. Publish summary where appropriate
9. Reopen systems carefully

---

# Maintenance Mode

Nami may need maintenance modes for high-risk systems.

Possible maintenance toggles:

* Pause badge issuance
* Pause boosts
* Pause NPC chat
* Pause membership upgrades
* Pause jury assignment
* Pause customization uploads
* Pause guild creation
* Pause squad sponsorship

Maintenance mode should be clearly communicated.

---

# User Communication

During incidents or outages, Nami should communicate:

* What is affected
* What is not affected
* Whether user assets are safe
* What users should avoid doing
* Expected next update time
* Recovery progress
* Final resolution

Avoid vague messaging.

Use plain language.

---

# Resilience Events

Future events may include:

* SystemPaused
* SystemResumed
* BoostCycleDelayed
* IndexerRecovered
* MaintenanceStarted
* MaintenanceEnded
* EmergencyNoticePublished
* ProviderFailureRecorded
* RecoveryModeEnabled

---

# Future Resilience Modules

Potential future modules:

* emergency_control.move
* pause_guard.move
* system_status.move
* provider_registry.move

These should be used carefully.

Emergency powers must be transparent and limited.

---

# Core Principles

User ownership should remain safe during outages.

Passport history should not disappear.

Badges should not be silently lost.

Boosts should not be double-counted.

Moderation restrictions should remain enforceable.

Appeals should remain reviewable.

Chat should degrade gracefully.

Discovery should recover from indexed events.

Nami should be resilient enough to feel trustworthy even when systems fail.

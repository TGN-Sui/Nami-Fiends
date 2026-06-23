# Nami Discovery System

## Overview

The Nami Discovery System helps users find channels, games, guilds, squads, events, developers, and communities.

Discovery should be community-driven, not ad-driven.

Discovery should reward quality, activity, trust, and participation while resisting manipulation from bots, spam, paid farming, and low-quality engagement.

---

## Core Purpose

Discovery answers:

"What should the Nami community see this cycle?"

Discovery should help surface:

* Quality game channels
* Active developer hubs
* Trusted guilds
* Healthy communities
* Meaningful events
* New rising channels
* Badge-worthy activities
* Communities supported by real members

---

## Discovery Inputs

Nami discovery may use multiple independent signals.

Planned inputs include:

* Boosts
* Reputation
* Badge quality
* Channel activity
* Guild activity
* Squad activity
* Developer verification
* Channel verification
* Conduct health
* Moderation health
* Event participation
* Member retention
* Engagement quality

No single signal should fully control discovery.

---

# Boosts

## Purpose

Boosts are direct community support signals.

Boosts help users show which channels or communities they want others to discover.

Current boost model:

* NPC: 0 boost access
* Adventurer: 1 boost power
* Pro: 6 boost power
* Elite: 8 boost power

Boosts should influence discovery but not fully determine discovery.

---

## Weekly Boost Cycles

Boosts should operate in weekly discovery cycles.

Weekly cycles help:

* Refresh rankings
* Prevent permanent dominance
* Encourage new discovery
* Give smaller communities regular opportunities
* Create consistent engagement rhythm

Boosts should not roll over between cycles.

Unused boosts expire at the end of the cycle.

---

## Per-Channel Boost Limits

Future rule:

```text
Each member may boost the same channel up to 3 times per cycle.
```

Purpose:

* Reduce concentrated influence
* Encourage discovery variety
* Prevent one member from overly dominating a single channel
* Encourage members to support multiple communities

---

# Reputation

## Purpose

Reputation helps discovery understand member quality.

Reputation ranks:

* Newbie
* Gamester
* Goblin
* Goonie
* Fiend

High-reputation users may have stronger signal quality in discovery analytics.

However, reputation should not automatically overpower all other signals.

---

## Reputation Abuse Prevention

Discovery should avoid over-rewarding reputation alone.

A high-reputation user should not be able to fully control rankings.

Reputation should be one signal among many.

---

# Badge Quality

## Purpose

Badge quality helps discovery understand whether a community produces meaningful activity.

Badges are more valuable when they represent real participation, achievement, or contribution.

Current badge types:

* Basic Badge
* Event Badge
* Completion Badge

Badge quality can help surface:

* Developer-hosted events
* Real community milestones
* Meaningful completion challenges
* Active seasonal events

---

## Low-Quality Badge Protection

Starting a game should not issue a Completion Badge.

Opening a game should not issue a Completion Badge.

Joining a channel should not issue a Completion Badge.

Low-quality badge issuance should not boost discovery ranking.

Badge farming should reduce issuer trust.

---

# Channel Activity

## Purpose

Channel activity shows whether a community is alive.

Activity signals may include:

* Active users
* Message quality
* Event participation
* Returning members
* Developer announcements
* Badge activity
* Guild participation
* Squad participation

Activity should be weighted by quality, not raw spam volume.

---

## Spam Protection

Discovery should not reward:

* Message spam
* Bot activity
* Idle farming
* Artificial activity loops
* Low-quality engagement

Raw message count should not be enough to rank a channel highly.

---

# Developer Verification

## Purpose

Verified developers and studios should have stronger trust signals.

Developer verification may help discovery prioritize:

* Official game channels
* Verified studio hubs
* Legitimate announcements
* Developer-hosted events
* Approved badge campaigns

Developer verification should improve trust but not guarantee permanent top ranking.

---

# Channel Verification

## Purpose

Verified channels should be easier to trust.

Verified channels may receive:

* Badge issuer eligibility
* Better discovery trust
* Channel customization rights
* NPC chat toggle controls
* Announcement tools

Channel verification does not guarantee high ranking.

The channel must still show quality, activity, and healthy moderation.

---

# Conduct Health

## Purpose

Conduct health helps discovery avoid surfacing harmful communities.

Conduct signals include:

* Green
* Orange
* Red
* Black

Discovery should treat Red as high-intensity, not automatically bad.

Black Passport users should not influence discovery while restricted.

---

## Channel Conduct Mix

Channels may naturally attract different conduct types.

Examples:

* Casual/cozy channels may attract Green users
* Competitive ranked channels may attract Orange users
* Hardcore PvP channels may attract Red users

This is acceptable.

Discovery should not punish Red-heavy channels by default unless moderation health is poor.

---

# Moderation Health

## Purpose

Moderation health protects the ecosystem from abusive communities.

Moderation health may consider:

* Warning frequency
* Mute frequency
* Channel bans
* Black Passport events
* Appeal outcomes
* Report volume
* Repeat offenders
* Moderator response time

A channel with high abuse and poor moderation should lose discovery trust.

---

## Appeal Outcomes

Appeals may affect moderation trust.

If many penalties are overturned, the system may review:

* Moderator behavior
* Channel rules
* Report quality
* Community bias
* Jury disagreement patterns

---

# Guild and Squad Activity

## Guild Signals

Guild activity may influence discovery through:

* Active members
* Events hosted
* Guild badges
* Guild reputation
* Retention
* Community growth
* Healthy moderation

---

## Squad Signals

Squads may influence discovery through:

* Sponsored member activity
* Trust relationships
* Event participation
* Community engagement
* Retention of sponsored members

Squad signals should be carefully weighted to prevent sponsorship farming.

---

# Event Discovery

Events may receive temporary discovery boosts.

Event discovery may consider:

* Verified host
* Event badge quality
* Participation levels
* Developer involvement
* Guild involvement
* Time sensitivity
* Member interest

Events should not permanently dominate discovery after the event ends.

---

# Channel Access Rules

Channel access rules affect who can participate.

Channels may define:

* NPC chat allowed
* NPC chat disabled
* Adventurer+ chat
* Pro+ chat
* Elite-only chat
* Reputation-gated chat
* Badge-gated chat
* Guild-gated chat
* Squad-gated chat

Discovery should still allow restricted channels to be found when appropriate, but access rules should be clearly visible.

---

# Discovery Ranking Philosophy

Discovery should balance:

* Freshness
* Quality
* Trust
* Activity
* Boosts
* Reputation
* Badge quality
* Moderation health
* Developer verification
* Community momentum

Discovery should not be controlled by:

* Payment alone
* Spam volume
* Bot farms
* Badge farming
* One whale user
* One guild network
* One developer partner

---

# Weekly Discovery Windows

Nami may use weekly discovery windows.

Possible weekly flow:

1. Boost cycle begins
2. Members boost favorite channels
3. Events and activity accumulate
4. Discovery engine ranks channels
5. Top communities are featured
6. Cycle resets
7. Boosts do not roll over

This creates recurring community momentum.

---

# Discovery Categories

Nami may eventually support multiple discovery categories.

Examples:

* Top Boosted
* Rising Channels
* New Developer Hubs
* Cozy Communities
* Competitive Communities
* Hardcore PvP
* Guild Spotlight
* Event Spotlight
* Badge Campaigns
* New Player Friendly
* Verified Game Channels

Different categories should use different ranking weights.

---

# Anti-Abuse Rules

Discovery must resist:

* Bot activity
* Fake boosts
* Badge farming
* Message spam
* Mass-report abuse
* Collusion
* Boost concentration
* Low-quality engagement
* Paid reputation manipulation

Potential safeguards:

* NPC boost restriction
* Verification gates
* Weekly reset cycles
* Per-channel boost limits
* Badge issuer review
* Conduct restrictions
* Moderation health checks
* Anomaly detection
* Human review for suspicious spikes

---

# On-Chain vs Off-Chain Design

## On-Chain

Sui should store or emit:

* BoostUsed events
* BadgeMinted events
* BadgePointsAdded events
* TierUpgraded events
* Conduct updates
* Channel access rule updates
* Guild and squad anchors
* Badge issuer approvals
* Moderation status proofs

---

## Off-Chain

The backend discovery engine should compute:

* Rankings
* Weighted scores
* Trending categories
* Anti-abuse analysis
* Moderation health
* Channel activity quality
* Event relevance
* Personalized discovery

Discovery ranking should be computed off-chain for flexibility and scale.

On-chain data should provide trustworthy signals.

---

# Phase 6 Ranking Engine (Shipped — v1)

The receiving server computes weekly discovery rankings off-chain from indexed projections.

**Engine:** `phase6-complete-v2` (`backend/src/discovery-scoring.ts`, `discovery-categories.ts`, `discovery.service.ts`)

**Channel score components:**

| Signal | Weight / rule |
| --- | --- |
| Boost power | ×10 per weekly power point |
| Boost count | ×2 per counted boost (after concentration cap) |
| Verified channel | +50 |
| Public channel | +10 |
| Owner badge quality | +8 issuer / +3 minted badges (cap +40) |
| Owner guild activity | +15 when a public guild has ≥8 members |
| Moderation health | −5 recent warning, −12 active mute, −20 active channel ban, −100 active black passport |
| Conduct health | +8 Green owner, +4 Orange, +2 Red; Black owners excluded |
| Squad activity | +2 per sponsored squad member (cap +16) |
| Public profile | +10 when owner profile is public |
| Reputation-weighted boosts | Booster passport reputation + membership tier scale raw boost power |
| Boost anomaly | −15 when one booster contributes >60% weighted power |

**Anti-abuse (v1):** each member may contribute at most **3 boosts per channel per weekly cycle**. Additional boosts are ignored and emit `boost-concentration-capped`.

**Guild score components:** member count ×5, public +10, active guild (≥8 members) +20, owner badge quality (cap +24), squad/profile signals, owner moderation penalties.

**Categories:** `featured`, `top_boosted`, `rising`, `verified`, `new_player_friendly`, `guild_spotlight`, `badge_campaigns`, `cozy`, `competitive`.

**API:**

```text
GET /api/discovery/categories
GET /api/discovery/channels?limit=&weekId=&category=
GET /api/discovery/guilds?limit=
```

Responses return `score_components` for transparency.

**Frontend:** Nami Hub crypto bubbles and Game Hub top tiles prefer live `score` from the indexer when connected; local boost power remains the offline fallback. Settings → Discovery panel exposes category tabs.

---

# Future Discovery Engine

Future backend components may include:

* Event indexer — shipped (Phase 2)
* Boost cycle processor — partial (weekly `week_id` aggregation)
* Badge quality analyzer — partial (issuer vs minted weighting)
* Channel ranking engine — shipped (v1)
* Guild ranking engine — shipped (v1)
* Event discovery engine
* Moderation health analyzer — partial (penalty model)
* Anti-abuse detector — partial (boost concentration cap)
* Personalized recommendation service

---

# Future Events

Discovery-related events may include:

* BoostUsed
* BoostCycleReset
* ChannelAccessRuleUpdated
* ChannelBadgePolicyUpdated
* BadgeIssuerApproved
* BadgeIssuerSuspended
* ConductSignalUpdated
* PassportDowned
* GuildCreated
* SquadMemberSponsored

---

# Core Principles

Discovery should help good communities get found.

Discovery should reward quality, not noise.

Discovery should be influenced by members, not controlled by payment.

Discovery should protect users from abusive spaces.

Discovery should give new and smaller communities a fair chance to rise.

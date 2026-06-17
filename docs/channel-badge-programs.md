# Verified Game Channel Badge Programs

## Purpose

Official Game Channel owners may issue badges when gamers meet **verified platform achievements** on **official launch platforms** (Steam, Epic, Xbox, etc.).

Nami must protect gamers from:

```text
Shovelware and one-hour completions used to farm reputation
AI-generated mini-games listed on stores solely to issue badges
Self-reported or retroactive achievement claims
Channels that do not actually control the listed game
```

Verification and timestamps are the backbone. **Verified ownership ≠ verified badge program.**

---

## Current Status

```text
Protocol foundation: BadgeIssuerCap, ISSUER_VERIFIED_CHANNEL (see badge_issuer.move)
Product policy: documented (this file)
Owner submission form: planned (questionnaire — polish later)
Automated eligibility checks: planned
```

---

# Issuer Requirements (Channel Owner)

## 1. Platform Link (Owner)

Channel owner must verify through each platform:

```text
Steam, Epic Games, Xbox, etc.
OAuth / official APIs only — never typed handles
```

## 2. Game Ownership Proof

Nami must verify the channel controls the game on that platform:

```text
Steam:  appid + publisher/developer relationship
Epic:   product / catalog id + seller entitlement
Xbox:   title / product id + publisher association (where API allows)
```

Without ownership proof: **no badge issuance authority** for that title.

## 3. Game Eligibility (Substance)

Store listing alone is insufficient. Games must pass **eligibility** before Completion-weight badges.

Example signals (tunable):

```text
Store tenure (minimum days live)
Minimum substantive playtime / completion expectations
Achievement design quality (not single-click completions)
Player base / review floors
Issuer probation for new channels
Abnormal issuance velocity detection
Admin review for obvious churn / asset-flip patterns
```

Tiers (conceptual):

```text
Ineligible     — no game badges
Probationary   — Basic / capped Event only
Eligible       — approved Event + Completion campaigns
Trusted        — higher caps after good standing
```

Short indie titles (~1 hour) used for badge farming must not receive Completion-grade programs.

---

# Badge Program Submission Form (Planned)

Verified channel owners submit a **questionnaire** per campaign (polish later).

Example question shapes (not final copy):

```text
Which platform? (Steam / Epic / Xbox)
Canonical game id on that platform (appid, product id, etc.)
Which achievement issues the game completion badge?
Which achievement issues a 50% completion badge (Event, 2 points)?
Which achievement issues a milestone Event badge?
Campaign start / end dates
Expected player effort (hours)
Badge type per milestone (Basic / Event / Completion)
```

Nami reviews or auto-validates against:

```text
Channel ownership proof
Game eligibility tier
Achievement exists on platform API
Achievement is non-trivial
Campaign rules
```

**No approved campaign → no mint.**

---

# Gamer Grant Rules

When a campaign is active, badges grant only if:

```text
Gamer has platform-verified link to Passport
achievement_unlocked_at > passport.created_at_ms
Achievement belongs to the channel's verified canonical game id
Platform API confirms unlock at grant time
Campaign rules satisfied
Issuer still holds valid BadgeIssuerCap for that channel/game
```

Pre-Passport achievements are never claimable.

---

# Badge Provenance

Platform- and channel-sourced badges should record:

```text
channel_id
issuer_id
platform
canonical_game_id
achievement_id
achievement_unlocked_at (from platform API)
badge_granted_at
campaign_id
```

Supports audit, disputes, unlink revocation, and discovery weighting.

---

# Unlink and Revocation (Gamer)

If a gamer unlinks a platform that sourced badges:

```text
Remove badges with source matching that platform link
Recalculate badge points, XP, reputation
Relink does not restore badges
Platform id remains sybil-bound to this Passport
```

See docs/onboarding.md and docs/verification.md.

---

# Channel Issuer Suspension

If channel loses ownership proof or abuses issuance:

```text
Suspend or downgrade BadgeIssuerCap
Stop new grants; investigate existing grants
Discovery deprioritizes ineligible shovelware programs
```

---

# Related Docs

```text
docs/badge-system.md
docs/verification.md
docs/onboarding.md
docs/events.md
docs/admin.md
```
# Nami Conduct System

## Purpose

The Conduct System gives each Passport a public interaction signal and restriction state.

Conduct helps players, channels, squads, guilds, jurors, and future discovery systems understand how a user is currently positioned socially and behaviorally.

Conduct is separate from:

* Reputation
* Membership
* Verification
* Archetype
* Badge history
* Titles
* Cosmetics
* Squad membership
* Guild membership

Conduct answers:

```text
What kind of interaction should others expect right now?
```

---

## Current Status

Current module:

```move
module nami::conduct
```

Current protocol status:

```text
80 tests passing
0 warnings
```

Phase 2 indexer (shipped):

```text
PassportTimelineService → /api/passports/:owner/timeline, /api/passports/:owner/timeline/snapshot (category: conduct)
ModerationService       → active records that drive Black Passport restrictions
```

Frontend surfaces: `ProtocolConductPanel`, passport timeline in `ProtocolHistoryPanel`, SDK `loadConductProtocolView` (chain + indexer merge).

See also: [moderation.md](./moderation.md), [access-control.md](./access-control.md), [events.md](./events.md).

Conduct is currently integrated with:

```text
membership.move
boost.move
channel.move
channel_access.move
moderation.move
jury.move
squad.move
guild.move
profile.move
title.move
cosmetics.move
```

---

# Conduct Signals

Current signals:

```text
Green
Orange
Red
Black
```

---

## Green

Green means friendly, casual, low-conflict, and generally safe for most spaces.

Typical meaning:

```text
Friendly / casual / easygoing
```

Green is user-selectable.

---

## Orange

Orange means serious, competitive, focused, but still respectful.

Typical meaning:

```text
Competitive / serious / friendly
```

Orange is user-selectable.

---

## Red

Red means high-intensity, PvP-heavy, trash-talk tolerant, or more aggressive gaming style.

Typical meaning:

```text
Hardcore / PvP / high-intensity
```

Red is user-selectable.

Red is not punishment.

---

## Black

Black is a moderation penalty state.

Typical meaning:

```text
Passport downed. Respawning in...
```

Black is not user-selectable.

Black is applied through moderation authority.

---

# Current Object

Current object:

```move
ConductStatus
```

Current purpose:

* Stores Passport-linked Conduct Signal
* Tracks owner
* Tracks Passport ID
* Tracks reason code
* Tracks expiration for Black Passport
* Tracks created and updated timestamps

---

# User-Controlled Signals

Users may choose:

```text
Green
Orange
Red
```

Users may update between these signals.

Users may not choose:

```text
Black
```

Black is reserved for moderation.

---

# Black Passport

Black Passport represents a temporary penalty state.

When Black Passport is active:

```text
Conduct Signal = Black
Effective access = NPC-equivalent restrictions
```

Current Black Passport restrictions include:

* Boosts blocked
* Channel chat blocked
* Channel creation blocked
* Squad benefits blocked
* Guild actions blocked
* Jury eligibility blocked
* Profile updates blocked
* Title claiming blocked
* Title equipping blocked
* Cosmetic equipping blocked
* Premium benefits temporarily restricted

Black Passport does not erase earned history by default.

Badges, reputation, titles, cosmetics, profiles, guild history, squad history, appeals, and recovery history should remain intact unless severe abuse requires separate review.

---

# Respawn

Black Passport includes a respawn timestamp.

Once the restriction expires, the user may respawn into a normal public signal:

```text
Green
Orange
Red
```

Current function:

```move
respawn_if_ready
```

Respawn should restore active benefits only after the Black Passport period has expired.

---

# Moderation Integration

Conduct is connected to Moderation.

Related module:

```move
module nami::moderation
```

Current flow:

```text
Moderation action
→ Black Passport
→ Conduct status updated
→ Active benefits restricted
```

AdminCap currently exposes this action for MVP purposes.

---

# Membership Integration

Conduct affects effective tier logic.

Related module:

```move
module nami::membership
```

Example:

```text
Raw Tier: Elite
Conduct: Black
Effective Access: NPC-equivalent
```

This prevents users from bypassing restrictions with paid or elevated membership.

---

# Channel Integration

Conduct affects both channel creation and channel chat.

Related modules:

```text
channel.move
channel_access.move
```

Black Passport blocks:

```text
Channel creation
Channel chat
```

Mutes and channel bans are handled through Moderation records and Channel Access checks.

---

# Squad and Guild Integration

Conduct affects social/community actions.

Related modules:

```text
squad.move
guild.move
```

Black Passport blocks:

```text
Squad creation
Squad sponsorship
Guild creation
Guild member management
```

Black Passport should not automatically delete existing Squads or Guilds.

---

# Jury Integration

Conduct affects jury eligibility.

Related module:

```move
module nami::jury
```

Current juror eligibility requires:

```text
Pro or Elite effective tier
No active Black Passport
```

Green, Orange, and Red do not block jury eligibility by themselves.

---

# Profile, Titles, and Cosmetics

Conduct affects customization updates.

Related modules:

```text
profile.move
title.move
cosmetics.move
```

Black Passport blocks:

```text
Profile updates
Title claiming
Title equipping
Cosmetic equipping
```

Existing profile objects, title proofs, and cosmetic unlocks are not deleted by default.

---

# Conduct and Reputation

Conduct is not reputation.

A user can have high reputation and still receive Black Passport for rule violations.

A user can have Red Conduct without being punished.

Reputation reflects earned contribution.

Conduct reflects interaction style and current restriction state.

---

# Conduct and Membership

Conduct is not membership.

Membership controls feature access.

Conduct can temporarily restrict effective benefits.

Payment should not bypass Conduct restrictions.

---

# Current Events

Conduct emits:

```text
ConductStatusCreated
ConductSignalUpdated
PassportDowned
PassportRespawned
```

Detailed event fields are documented in:

```text
docs/events.md
```

---

# Current Test Coverage

Current tests verify:

```text
Conduct status creation
Green signal creation
User signal updates
User cannot select Black
Black Passport disables active benefits
Black Passport forces effective tier to NPC
Black Passport blocks channel chat
Moderation can issue Black Passport
Black Passport blocks Profile updates
Black Passport blocks Title claiming
Black Passport blocks Cosmetic equipping
```

---

# Future Work

Planned improvements:

```text
Orange-specific UI display
Red-specific channel matching
Conduct history views
Community reporting inputs
Channel owner conduct preferences
Guild conduct preferences
Automatic conduct recommendations
Respawn countdown display
Appeal-linked Black Passport review
Conduct analytics for discovery
```

---

# Design Rules

Green, Orange, and Red are identity signals.

Black is the only punishment signal.

Red should not be treated as bad behavior by default.

Black should restrict active benefits but not erase history by default.

Conduct should support compatibility between gamers, not just punishment.

Conduct restrictions must apply through effective access checks.

---

# Related Docs

```text
docs/moderation.md
docs/access-control.md
docs/events.md
docs/membership.md
docs/customization.md
docs/trust-system.md
```

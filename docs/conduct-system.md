# Nami Conduct System

## Purpose

The Conduct System gives each Passport a public interaction signal.

It helps players, channels, squads, jurors, and future guilds understand what kind of interaction to expect from a user.

Conduct is separate from:

* Reputation
* Membership
* Verification
* Archetype
* Badge history

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
33 tests passing
0 warnings
```

Conduct is already wired into effective access checks through Membership, Channel Access, Boosts, Jury eligibility, and Squads.

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

* Stores Passport-linked conduct signal
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

* Conduct signal becomes Black
* Effective tier falls back to NPC-equivalent access
* Boosts are blocked
* Channel chat is blocked
* Squad benefits are blocked
* Jury eligibility is blocked
* Premium benefits are temporarily restricted

Black Passport does not erase earned history by default.

Badges, reputation history, identity, and Passport ownership remain intact unless severe abuse requires separate review.

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

Respawn should restore access only after the active Black period has expired.

---

# Moderation Integration

Conduct is connected to Moderation.

Related module:

```move
module nami::moderation
```

Moderation can issue Black Passport through authority-gated paths.

Current flow:

```text
Moderation action → Black Passport → Conduct status updated → Benefits restricted
```

AdminCap currently exposes this action for MVP purposes.

---

# Access Integration

Conduct affects access through effective tier logic.

Related modules:

```text
membership.move
boost.move
channel_access.move
jury.move
squad.move
```

Current effect:

```text
Black Conduct = NPC-equivalent benefits
```

This prevents users from bypassing restrictions with Pro or Elite tier.

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

Example:

```text
Raw Tier: Elite
Conduct: Black
Effective Access: NPC-equivalent
```

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

* Conduct status creation
* Green signal creation
* User signal updates
* User cannot select Black
* Black Passport disables active benefits
* Black Passport forces effective tier to NPC
* Black Passport blocks channel chat
* Moderation can issue Black Passport

---

# Future Work

Planned improvements:

```text
Orange-specific UI display
Red-specific channel matching
Conduct history views
Community reporting inputs
Channel owner conduct preferences
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

Black should restrict benefits but not erase history by default.

Conduct should support compatibility between gamers, not just punishment.

---

# Related Docs

```text
docs/moderation.md
docs/access-control.md
docs/events.md
docs/membership.md
docs/trust-system.md
```

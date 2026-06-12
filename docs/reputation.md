# Nami Reputation System

## Overview

The Nami Reputation System measures earned contribution, meaningful activity, and progression across the Nami ecosystem.

Reputation is separate from:

* Membership
* Verification
* Conduct Signal
* Gamer Archetype
* Guild Role
* Squad Status

Reputation answers:

"What has this player earned through meaningful participation?"

Membership answers:

"What features can this player access?"

Conduct Signal answers:

"What kind of interaction should others expect from this player right now?"

---

## Core Principle

Reputation cannot be purchased.

Reputation must be earned through meaningful participation, achievement, and contribution.

A user should not be able to buy their way into high reputation.

---

# Reputation Ranks

Nami currently defines five reputation ranks:

* Newbie
* Gamester
* Goblin
* Goonie
* Fiend

These ranks are stored in the Passport object.

---

# Newbie

## Description

Newbie is the default reputation rank.

Every new Passport starts as Newbie.

Newbie means the player is new to the Nami ecosystem or has not yet earned enough progression to move into a higher reputation rank.

---

## Typical Meaning

A Newbie may be:

* New to Nami
* Still onboarding
* Learning the system
* Exploring communities
* Building early badge history

Newbie does not mean bad.

It only means the player has limited earned history.

---

# Gamester

## Description

Gamester represents early established participation.

Gamester users have started building meaningful activity.

---

## Typical Meaning

A Gamester may have:

* Earned early badge points
* Reached early level milestones
* Participated in events
* Completed basic activities
* Started building visible history

Gamester is the first meaningful step beyond Newbie.

---

# Goblin

## Description

Goblin represents consistent participation.

Goblin users have shown stronger activity and deeper involvement.

---

## Typical Meaning

A Goblin may have:

* Earned multiple meaningful badges
* Participated in repeated events
* Completed verified activities
* Built stronger Passport history
* Shown more consistent community presence

Goblin should feel like a respected mid-level reputation state.

---

# Goonie

## Description

Goonie represents established community standing.

Goonie users have built meaningful history and have likely contributed across multiple activities or communities.

---

## Typical Meaning

A Goonie may have:

* Strong badge history
* Significant level progression
* Event participation history
* Verified completion achievements
* Meaningful community contribution

Goonie users should feel recognized.

---

# Fiend

## Description

Fiend represents legendary earned standing.

Fiend users have reached the highest current reputation tier.

---

## Typical Meaning

A Fiend may have:

* High badge points
* High level progression
* Meaningful completion history
* Long-term participation
* Strong contribution history
* Seasonal achievement

Fiend should be difficult to earn and meaningful to display.

---

# Current Reputation Values

Current on-chain values:

```text
0 = Newbie
1 = Gamester
2 = Goblin
3 = Goonie
4 = Fiend
```

---

# Reputation Inputs

Current inputs:

* Badge points
* XP
* Level progression

Future inputs may include:

* Community contribution
* Guild participation
* Squad participation
* Developer contributions
* Event hosting
* Verified creator activity
* Moderation health
* Badge issuer quality

---

# Badge-Based Progression

Badges are the current primary source of reputation progression.

Current badge point model:

```text
Basic Badge = 1 point
Event Badge = 2 points
Completion Badge = 3 points
```

Badge points currently feed:

* XP
* Level progression
* Reputation progression

---

## Badge Quality Matters

Nami prioritizes badge quality over passive activity.

A few meaningful badges should matter more than hours of idle playtime.

Examples of meaningful badge sources:

* Completed events
* Verified challenges
* Developer-hosted playtests
* Major game milestones
* Community contribution
* Real completion objectives

---

## Invalid Reputation Farming Actions

The following should not meaningfully increase reputation by themselves:

* Opening a game
* Starting a new game
* Joining a channel
* Sending one message
* Idling in a lobby
* Staying online while AFK
* Buying a cosmetic
* Holding an asset without activity
* Clicking a claim button without achievement

These actions may support onboarding or analytics, but they should not create high-value reputation.

---

# Curved Level Progression

Nami uses curved level progression.

The old linear model is not used.

The goal is:

* Fast early levels
* Slower higher levels
* Meaningful long-term progression
* Level 100 as a dedication milestone
* Seasonal reset compatibility

---

## Current XP Source

XP is currently earned through badge points.

Current model:

```text
1 badge point = 1 XP
```

Because badges currently provide only 1, 2, or 3 points, a single badge should not create excessive level jumps.

---

## Current Level Curve

The current level curve increases XP requirements as the player levels up.

Approximate curve:

```text
Level 1-9:   5-7 XP per level
Level 10-29: 7-11 XP per level
Level 30-59: 12-17 XP per level
Level 60-89: 18-25 XP per level
Level 90-99: 26-35 XP per level
```

This creates a progression curve that slows down naturally as levels increase.

---

## Level 100 Target

Level 100 should represent meaningful dedication.

Design goal:

```text
A highly dedicated player should reach Level 100 in roughly 3 months.
A steady player may take closer to a full season.
```

Future seasons may reset around 6 months.

This gives active players enough time to progress while keeping the system fresh.

---

# Reputation Threshold Direction

Current reputation is influenced by both badge points and level progression.

Approximate intended reputation direction:

```text
Newbie   = starting state
Gamester = early established activity
Goblin   = consistent participation
Goonie   = established standing
Fiend    = legendary seasonal standing
```

Reputation should become harder to earn at higher levels.

The system should avoid a flat linear grind.

---

# Reputation and Seasons

Future Nami seasons may reset or archive seasonal progression.

Potential seasonal systems:

* Seasonal XP
* Seasonal level
* Seasonal reputation progress
* Seasonal prestige points
* Seasonal leaderboards
* Seasonal titles
* Seasonal cosmetics

Seasonal reset should not delete:

* Identity
* Passport ownership
* Historical badges
* Lifetime achievement history
* Membership history
* Guild history
* Squad history

---

## Seasonal Reset Philosophy

Seasonal resets should create fresh competition without erasing identity.

Players should feel like:

```text
"My season reset, but my journey still matters."
```

Not:

```text
"Everything I earned disappeared."
```

Historical achievements should remain visible through badges, titles, archives, or legacy records.

---

# Prestige

Prestige is planned for players who reach Level 100 early.

Once a player reaches Level 100, additional XP may feed Prestige progress.

Prestige may later unlock:

* Prestige titles
* Prestige profile frames
* Passport effects
* Seasonal honors
* Rare cosmetics
* Badge effects
* Puzzle pieces
* Public achievement markers

Prestige should reward dedication without making late-starting players feel permanently excluded.

---

# Reputation and Membership

Reputation and Membership are separate.

Membership tiers:

* NPC
* Adventurer
* Pro
* Elite

Reputation ranks:

* Newbie
* Gamester
* Goblin
* Goonie
* Fiend

A user may be:

* NPC with meaningful reputation history
* Adventurer with low reputation
* Pro with low reputation
* Elite with high reputation
* Elite with Black Signal

Membership controls access.

Reputation reflects earned contribution.

---

# Reputation and Verification

Verification does not automatically grant reputation.

Verification proves humanity or account authenticity.

A verified user still starts with earned reputation progress based on activity.

Verification may unlock access to systems where reputation can be earned more fully.

---

# Reputation and Conduct Signal

Conduct Signal does not directly define reputation.

Conduct signals:

* Green
* Orange
* Red
* Black

Green, Orange, and Red represent interaction style or current social expectations.

Black represents a moderation penalty.

A user may have high reputation and still receive Black Signal if they violate rules.

Conduct penalties may pause access, but they should not automatically erase earned history.

---

# Reputation and Moderation

Moderation actions may affect access and conduct status.

Moderation should not automatically delete reputation.

Possible future moderation effects:

* Pause reputation gain
* Pause badge claiming
* Pause prestige progress
* Reduce discovery influence
* Restrict jury eligibility
* Trigger review of suspicious badge history

Severe abuse may require badge review or revocation, but this should be evidence-based.

---

# Reputation and Discovery

Reputation may influence discovery systems.

High-reputation members may provide stronger quality signals.

However, reputation should not fully control discovery.

Discovery should also consider:

* Boosts
* Badge quality
* Channel activity
* Conduct health
* Moderation health
* Developer verification
* Guild activity
* Squad activity
* Engagement quality

---

# Reputation and Badge Issuers

Badge issuers affect reputation quality.

If a badge issuer abuses badge authority, reputation systems may be harmed.

Future issuer trust should control:

* Badge issuance limits
* Badge types allowed
* Completion Badge authority
* Badge review requirements
* Issuer suspension
* Badge revocation

Reputation depends on badge integrity.

---

# Anti-Abuse Rules

The Reputation System must resist:

* Badge farming
* Bot farming
* Idle farming
* Pay-to-reputation behavior
* Fake completion badges
* Collusive badge issuance
* Spam-based activity farming
* Multi-account abuse

High reputation should be difficult to fake.

---

# Future Improvements

Future reputation features may include:

* Lifetime reputation
* Seasonal reputation
* Reputation history
* Reputation decay for inactivity
* Reputation freeze during Black Signal
* Badge quality weighting
* Issuer trust weighting
* Guild contribution weighting
* Creator contribution weighting
* Developer contribution weighting
* Prestige rank systems

---

# Current Move Implementation

Current module:

```move
module nami::passport
```

Reputation is currently updated by:

```move
update_reputation_from_progress(...)
```

Badge points are applied through:

```move
apply_badge_points(...)
```

XP is applied through:

```move
add_xp(...)
```

Current public getters include:

```move
get_reputation(...)
get_level(...)
get_badge_points(...)
get_xp(...)
get_level_progress(...)
get_prestige_points(...)
```

---

# Core Principles

Reputation must be earned.

Badge quality matters.

Completion must mean completion.

Idle time should not create reputation.

Membership should not buy reputation.

Conduct should not replace reputation.

Seasons should refresh progression without erasing identity.

Prestige should reward dedication after Level 100.

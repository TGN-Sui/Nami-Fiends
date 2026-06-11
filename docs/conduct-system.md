# Nami Conduct System

## Overview

The Nami Conduct System adds a public identity signal layer to the Passport.

This system helps players quickly understand what type of interaction to expect from another player without confusing conduct with membership or reputation.

Conduct is separate from:

* Membership Tier
* Reputation Rank
* Gamer Archetype
* Guild Role
* Badge History

Conduct answers:

"What kind of interaction should others expect from this player right now?"

---

## Core Conduct Signals

Nami uses four public Passport Signals:

* Green
* Orange
* Red
* Black

These signals are visible on public profiles, chat identity surfaces, channel member lists, and future overlays.

---

## Green Signal

Green represents friendly, casual, low-conflict players.

Typical meaning:

* Casual gamer
* Beginner-friendly
* Cooperative
* Positive community behavior
* Low moderation history

Green does not mean the player is highly skilled or high reputation.

Green means the player is likely safe and easy to interact with.

---

## Orange Signal

Orange represents serious but friendly players.

Typical meaning:

* Competitive but respectful
* Focused gamer
* Event participant
* Ranked or objective-driven player
* Generally positive standing

Orange is intended for players who take games seriously while still respecting community standards.

---

## Red Signal

Red represents high-intensity players.

Typical meaning:

* Hardcore PvP
* Competitive trash-talk tolerant
* High-intensity environments
* Aggressive gameplay preference
* Risk-tolerant social spaces

Red does not automatically mean unsafe.

Red means the player may prefer intense gameplay and less casual interaction.

Red should never be treated as a punishment state by itself.

---

## Black Signal

Black represents a moderation penalty.

A Black Passport means the player's Passport is temporarily downed.

Public language:

"Passport downed. Respawning in..."

During Black Signal status, the user temporarily falls back to NPC-level benefits.

Restrictions may include:

* No boosts
* No squad slots
* No guild creation
* No badge claiming
* No prestige progress
* Limited chat access
* No discovery influence
* No verified gated channel access

Black Signal is not a personality label.

Black Signal is a temporary restriction state caused by moderation action.

---

## Conduct vs Reputation

Conduct and reputation are separate.

A user may have:

* High reputation and Green Signal
* High reputation and Red Signal
* Low reputation and Green Signal
* Black Signal with any prior reputation

Reputation reflects long-term contribution.

Conduct reflects current interaction expectations and moderation standing.

---

## Conduct vs Membership

Conduct and membership are separate.

A user may be:

* NPC with Green Signal
* Elite with Red Signal
* Pro with Black Signal
* Adventurer with Orange Signal

Membership controls access.

Conduct communicates interaction state.

---

## Conduct Assignment

Green, Orange, and Red may be influenced by:

* Player self-selection
* Archetype choices
* Channel behavior
* Gameplay preference
* Community feedback
* Moderation history

Black may only be assigned by moderation systems or authorized moderation processes.

---

## Community Influence

Community feedback may influence Conduct Signals, but community voting should not directly punish users.

Community reports may trigger:

* Review
* Warning
* Temporary mute
* Channel ban
* Black Passport review

Community feedback is a signal, not an automatic verdict.

---

## On-Chain vs Off-Chain Design

Conduct status may eventually be anchored on-chain.

Suggested future fields:

* conduct_signal
* conduct_expires_at_ms
* conduct_reason_code
* conduct_version

Most evidence should remain off-chain.

On-chain state should only store:

* Status
* Duration
* Authority
* Event proof

---

## Future Move Module

Potential module:

conduct.move

Possible objects:

* ConductStatus
* ConductAction
* ConductSignalRecord

Possible events:

* ConductSignalUpdated
* PassportDowned
* PassportRespawned

---

## Core Principle

Conduct should help players choose compatible communities without turning personality, membership, reputation, and punishment into one confusing score.

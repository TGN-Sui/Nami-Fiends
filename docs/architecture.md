# Nami Architecture v1.0

## Overview

Nami uses a hybrid architecture:

* Sui Move → ownership + proofs
* Off-chain engines → computation + ranking
* SDK → integration layer
* Clients → experience layer

---

## 1. On-Chain Layer (Sui Move)

Responsible for:

* Identity objects
* Passport objects
* Badges (NFT-like objects)
* Guild objects
* Squad endorsements
* Verification proofs
* Capability caps

---

## 2. Off-Chain Engine

Responsible for:

* Trust scoring
* Reputation calculation
* Discovery ranking
* Boost processing
* XP calculation
* Messaging logic

---

## 3. SDK Layer

Used by games and apps to interact with Nami:

* Identity SDK
* Passport SDK
* Guild SDK
* Discovery SDK
* Messaging SDK

---

## 4. Client Layer

Any game, app, or dApp integrating Nami.

Examples:

* Unity games
* Unreal games
* Web games
* NFT platforms

---

## Core Rule

Sui stores truth.

Off-chain computes intelligence.

SDK exposes access.

Clients render experience.

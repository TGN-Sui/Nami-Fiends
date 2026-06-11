# Nami Event Registry

## Overview

Events provide an auditable record of important actions within the Nami Protocol.

Events are emitted by smart contracts and can be indexed by applications, dashboards, analytics systems, and future protocol services.

---

## Identity Events

### IdentityCreated

Emitted when a new Identity is created.

Fields:

* identity_id
* owner

---

### IdentityVerified

Emitted when an Identity becomes verified.

Fields:

* identity_id
* verification_source

---

## Passport Events

### PassportCreated

Emitted when a Passport is created.

Fields:

* passport_id
* identity_id

---

### XPAdded

Emitted when experience points are awarded.

Fields:

* passport_id
* amount

---

### BadgePointsAdded

Emitted when badge points are applied.

Fields:

* passport_id
* amount
* total

---

## Badge Events

### BadgeMinted

Emitted when a badge is issued.

Fields:

* owner
* badge_type
* points

---

## Boost Events

### BoostUsed

Emitted when a boost is activated.

Fields:

* owner
* channel_id
* power

---

## Membership Events

### TierUpgraded

Planned.

Emitted when a user upgrades membership.

Fields:

* passport_id
* previous_tier
* new_tier

---

### MembershipRenewed

Planned.

Emitted when membership duration is extended.

Fields:

* passport_id
* tier
* expiration

---

## Recovery Events

### RecoveryRequested

Planned.

Fields:

* identity_id
* requester

---

### RecoveryApproved

Planned.

Fields:

* identity_id
* approver

---

### RecoveryCompleted

Planned.

Fields:

* identity_id
* new_owner

---

## Event Design Principles

Events should:

* Be lightweight
* Be auditable
* Be indexable
* Avoid unnecessary data duplication

Events are intended to provide a transparent record of protocol activity while minimizing on-chain storage costs.

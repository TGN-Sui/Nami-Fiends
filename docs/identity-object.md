# Nami Identity Object

## Overview

The Identity object is the root ownership object in the Nami protocol.

Identity answers:

Who owns this Nami presence?

The Identity object should remain small, stable, and secure.

It should anchor ownership, verification placeholders, Passport linking, recovery paths, and future identity-provider relationships.

---

## Current Move Module

Current module:

```move
module nami::identity
```

Current source file:

```text
contracts/nami/sources/identity.move
```

---

## Object Responsibility

Identity is responsible for storing:

* Owner
* Verification level placeholder
* Trust tier placeholder
* Passport reference placeholder
* Creation timestamp
* Version

Identity should not store:

* XP
* Level
* Badge points
* Reputation
* Membership tier
* Boost score
* Prestige points
* Chat messages
* Guild membership
* Squad relationships
* Moderation evidence
* Appeal evidence
* Customization layout
* Avatar configuration

Those belong in other systems.

---

## Identity Struct

Current structure:

```move
public struct Identity has key {
    id: UID,
    owner: address,
    trust_tier: u8,
    verification_level: u8,
    passport_id: option::Option<address>,
    created_at_ms: u64,
    version: u8,
}
```

---

# Field Definitions

## id

Type:

```move
UID
```

Purpose:

The unique Sui object identifier for the Identity.

This is the on-chain anchor for the user's Nami presence.

---

## owner

Type:

```move
address
```

Purpose:

The wallet or zkLogin-controlled address that owns the Identity.

The owner controls the Identity object.

Future recovery systems may allow controlled ownership transfer through secure recovery flows.

---

## trust_tier

Type:

```move
u8
```

Purpose:

Reserved placeholder for future trust classification.

Current status:

```text
Reserved / placeholder
```

Trust should eventually be derived from multiple signals, including:

* Verification
* Reputation
* Conduct Signal
* Moderation history
* Badge quality
* Recovery safety
* Linked account confidence

The current field should not be treated as a complete trust score yet.

---

## verification_level

Type:

```move
u8
```

Purpose:

Reserved placeholder for future verification strength.

Potential future values may represent:

```text
0 = Unverified
1 = Human Verified
2 = Strong Verified
3 = Developer Verified
4 = Organization Verified
```

Current status:

```text
Reserved / placeholder
```

Verification should help determine eligibility for NPC to Adventurer transition.

Verification should not directly create reputation.

---

## passport_id

Type:

```move
option::Option<address>
```

Purpose:

Optional reference to the user's Passport object.

This field is intended to connect:

```text
Identity → Passport
```

Current status:

```text
Reserved for future automatic Passport linking
```

The Passport currently exists as a separate object.

Future modules may link the Passport address into Identity after Passport creation.

---

## created_at_ms

Type:

```move
u64
```

Purpose:

Timestamp of Identity creation in milliseconds.

Potential uses:

* Account age
* Verification age
* Recovery checks
* Trust analysis
* Eligibility for future systems
* Historical indexing

---

## version

Type:

```move
u8
```

Purpose:

Version marker for future migrations.

Current version:

```text
1
```

This helps future upgrades identify the schema version of the Identity object.

---

# Default Identity State

When created, an Identity starts with:

```text
owner = transaction sender
trust_tier = 0
verification_level = 0
passport_id = none
version = 1
```

The Identity is transferred to the sender.

---

# Identity Creation Flow

Current flow:

1. User signs in or connects wallet.
2. `init_identity` is called.
3. Identity object is created.
4. Owner is set to transaction sender.
5. IdentityCreated event is emitted.
6. Identity object is transferred to the owner.

Current public initializer:

```move
public fun init_identity(ctx: &mut TxContext)
```

---

# IdentityCreated Event

Emitted when a new Identity is created.

Fields:

* identity_id
* owner

Purpose:

* Track new Identity creation
* Initialize indexing
* Support future profile creation
* Support future Passport linking
* Support analytics and onboarding flows

---

# Ownership Model

The Identity object is owned by the user.

Ownership may come from:

* zkLogin-created wallet
* Existing Sui wallet
* Future recovery-controlled ownership transfer

Identity ownership should be treated as highly sensitive.

Any future ownership transfer must be gated through secure recovery logic.

---

# zkLogin Relationship

zkLogin should allow users to access Nami without needing to understand wallet management.

Ideal onboarding flow:

```text
Sign in → Identity → Passport → Start journey
```

The Identity object should work with zkLogin-backed addresses.

---

# Wallet Relationship

Users with existing Sui wallets should be able to own Identity objects directly.

Wallet ownership alone should not automatically prove humanity.

Wallet ownership is one identity signal, not a complete verification system.

---

# Passport Relationship

Identity and Passport are separate objects.

Identity represents ownership.

Passport represents the gamer journey.

Future Passport linking may use:

```move
passport_id: option::Option<address>
```

Potential future event:

```text
PassportLinked
```

---

# Membership Relationship

Membership tier currently lives in Passport.

Identity may store verification-related information that helps determine whether the Passport can move from NPC to Adventurer.

Identity should not directly store Pro or Elite access state.

Future membership authority should live in:

```text
membership.move
```

---

# Verification Relationship

Identity should eventually connect to verification systems.

Future verification may support:

* zkLogin verification
* X.com verification carryover
* SuiNS verification
* Steam account linkage
* Epic Games account linkage
* Email verification
* Developer verification
* Organization verification
* Privacy-preserving proofs

Verification should update verification-related state, not reputation directly.

---

# Trust Relationship

Trust should eventually be layered.

Identity may contribute to trust through:

* Account age
* Verification strength
* Linked account confidence
* Recovery history
* Consistent ownership

Trust should not be determined from Identity alone.

Trust should also consider:

* Passport reputation
* Conduct Signal
* Moderation history
* Badge quality
* Issuer trust
* Guild and squad relationships

---

# Recovery Relationship

Identity is the object most likely to be affected by account recovery.

Future recovery may support:

* zkLogin recovery
* Linked social recovery
* Linked game account recovery
* Optional email recovery
* Squad support
* Guild support
* Manual review

Recovery should preserve the user's Passport whenever possible.

Recovery must prevent instant account takeover.

---

# Privacy Rules

Identity should avoid storing raw private data on-chain.

Do not store:

* Real names
* Email addresses
* Raw social handles
* Private game account IDs
* Private recovery secrets
* Personal documents
* Moderation evidence
* Appeal evidence

On-chain should store proofs, references, status, and events.

Private data should remain off-chain or encrypted.

---

# Future Linked Account Design

Future linked account systems may support:

* X.com
* Steam
* Epic Games
* Discord
* Email
* SuiNS
* Google
* Apple

Linked accounts should help prevent duplicate identities.

A single external account should not be reusable across multiple Nami Identities.

This supports:

```text
1 Human → 1 Primary Nami Identity
```

---

# Future Developer Identity

Developer identities may require stronger verification.

Developer Identity may support:

* Studio ownership
* Game hub ownership
* Channel ownership
* Badge issuer authority
* Announcement rights
* Developer profile verification

Developer verification should not be treated the same as basic player verification.

---

# Future Organization Identity

Organizations may include:

* Game studios
* Guild organizations
* Esports teams
* Partner communities
* Event organizers

Organization identities may require separate verification and authority rules.

---

# Current Public Functions

Current public function:

```move
init_identity(ctx)
```

Current internal function:

```move
create_identity(ctx)
```

Future functions may include:

* link_passport
* update_verification_level
* link_provider
* unlink_provider
* recover_identity
* transfer_owner_after_recovery
* verify_developer
* verify_organization

---

# Current Access Boundaries

External users can create an Identity.

External users should not be able to directly modify:

* owner
* trust_tier
* verification_level
* passport_id
* version

Future mutation should be controlled by authority modules.

---

# Future Events

Potential future Identity events:

* IdentityCreated
* IdentityVerified
* PassportLinked
* VerificationSourceLinked
* VerificationSourceRemoved
* VerificationLevelUpdated
* IdentityRecovered
* OwnerUpdated
* DeveloperVerified
* OrganizationVerified

Events should avoid exposing private provider data.

---

# Future Object Evolution

Possible future options:

1. Keep Identity small and stable.
2. Store linked account proofs in separate objects.
3. Store verification records in separate objects.
4. Store recovery records in separate objects.
5. Store developer or organization authority in separate objects.

The preferred direction is to keep Identity minimal and move specialized logic into companion modules.

---

# Current Boundaries

Identity should not become:

* Passport
* Profile
* Chat account
* Guild membership record
* Moderation file
* Recovery evidence storage
* Customization settings object

Identity should remain the root ownership anchor.

---

# Core Principle

Identity is the root of ownership.

Passport is the record of the journey.

Identity should be stable enough to last across many future versions of Nami.

It should be simple, secure, privacy-conscious, and easy to recover without exposing unnecessary personal data.

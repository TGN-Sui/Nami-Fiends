# Break-the-System Wave 2 — Object Pairing + State Transition Hardening Receipt

## Status

Completed.

Final verification:

- Move build: passing
- Move tests: 75 passing
- Warnings: 0
- Errors: 0

## Purpose

Wave 2 focused on adversarial object-pairing attacks and finalized-state transition abuse across Nami Chat's Move modules.

The goal was to prove that users cannot mix valid objects from different Passport, Channel, Guild, Squad, Appeal, Recovery, or Jury contexts to bypass authorization checks.

## Completed Adversarial Checks

### Wave 2A — Profile Passport Pairing

Profile update rejects the wrong Passport pairing.

Blocked attack:

- Profile linked to Passport A
- User attempts to update it using Passport B

Result: rejected successfully.

### Wave 2B — TitleDisplay EarnedTitle Pairing

TitleDisplay rejects a mismatched EarnedTitle.

Blocked attack:

- TitleDisplay linked to Passport A
- EarnedTitle linked to Passport B
- User attempts to equip the wrong title

Result: rejected successfully.

### Wave 2C — CosmeticLoadout CosmeticUnlock Pairing

CosmeticLoadout rejects a mismatched CosmeticUnlock.

Blocked attack:

- CosmeticLoadout linked to Passport A
- CosmeticUnlock linked to Passport B
- User attempts to equip the wrong unlock

Result: rejected successfully.

### Wave 2D — ChannelAccessPolicy Channel Pairing

ChannelAccessPolicy rejects the wrong Channel pairing.

Blocked attack:

- Policy belongs to Channel A
- User attempts to update it through Channel B

Result: rejected successfully.

### Wave 2E — Squad Sponsorship Passport Pairing

Squad sponsorship rejects the wrong Passport pairing.

Blocked attack:

- Squad created with Passport A
- User attempts to sponsor a member using Passport B

Source hardening added:

- `squad::sponsor_member` now verifies that the Squad owner Passport ID matches the provided Passport ID.

Result: rejected successfully.

### Wave 2F — Guild Member Add Passport Pairing

Guild member add rejects the wrong Passport pairing.

Blocked attack:

- Guild created with Passport A
- User attempts to add a member using Passport B

Source hardening added:

- `guild::add_member` now verifies that the Guild owner Passport ID matches the provided Passport ID.

Result: rejected successfully.

### Wave 2G — Appeal ModerationRecord Pairing

Appeal opening rejects the wrong Passport / ModerationRecord pairing.

Blocked attack:

- ModerationRecord issued against Passport A
- User attempts to open appeal using Passport B

Result: rejected successfully.

### Wave 2H — Appeal Double Resolution

Appeal cannot be resolved twice.

Blocked attack:

- Admin resolves an AppealCase once
- Admin attempts to resolve the same AppealCase again

Result: rejected successfully.

### Wave 2I — Recovery Double Resolution

Recovery request cannot be resolved twice.

Blocked attack:

- Admin resolves a RecoveryRequest once
- Admin attempts to resolve the same RecoveryRequest again

Result: rejected successfully.

### Wave 2J — JuryCase From Resolved Appeal

JuryCase cannot be opened from a resolved Appeal.

Blocked attack:

- AppealCase is opened
- Admin resolves the AppealCase
- Admin attempts to open a JuryCase from the resolved AppealCase

Result: rejected successfully.

## Source Hardening Added During Wave 2

### `sources/squad.move`

`squad::sponsor_member` now requires the Squad's owner Passport ID to match the provided Passport ID.

### `sources/guild.move`

`guild::add_member` now requires the Guild's owner Passport ID to match the provided Passport ID.

## Security Outcome

Wave 2 closes a major class of object-mixing attacks.

Nami Chat now has stronger guarantees that:

- Passport-linked objects cannot be mixed across unrelated Passport contexts.
- Guild and Squad authority cannot be reused through another Passport owned by the same wallet.
- Channel access policies cannot be updated through unrelated Channels.
- Moderation appeals cannot be opened with unrelated Passport records.
- Resolved Appeals and RecoveryRequests cannot be finalized twice.
- Jury review cannot be started from an already-resolved Appeal.

## UI Readiness Impact

Wave 2 completes the adversarial hardening needed before UI reference/design intake.

The frontend can now safely represent these MVP primitives:

- Profile management
- Title display
- Cosmetic loadout
- Channel access policy
- Squad sponsorship
- Guild membership
- Appeal handling
- Recovery handling
- Jury review lifecycle

## Checkpoint

Break-the-System Wave 2 is complete.

Next phase:

- UI reference/design intake
- Presentable MVP interface planning
- Frontend screen map
- User onboarding flow refinement
- Wallet / zkLogin / demo-mode UX decisions

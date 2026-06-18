# Nami Customization

## Purpose

Customization gives players visible identity expression on top of their Passport.

This layer supports profile presentation, earned titles, cosmetic unlocks, and future avatar/display systems.

Customization should make Nami feel gamer-native without turning cosmetics into reputation, trust, or authority.

---

## Current Status

Implemented modules:

```text
profile.move
title.move
cosmetics.move
```

Current protocol status:

```text
55 tests passing
0 warnings
```

---

# Profile System

Current module:

```move
module nami::profile
```

The Profile object is the public display anchor for a Passport.

Current profile fields include:

* Owner
* Passport ID
* Display name
* Bio reference
* Avatar reference
* Metadata reference
* Public/private setting

Profiles store references, not rich media directly.

Profile media, long bios, and avatar configuration should live off-chain.

---

## Profile Rules

NPC users may create Profiles.

Black Passport users cannot create or update Profiles while restricted.

Profile updates require:

```text
Profile owner
Matching Passport
Matching ConductStatus
Active benefits
```

---

# Title System

Current module:

```move
module nami::title
```

Titles are earned display proofs.

Current title flow:

```text
Passport reputation → EarnedTitle → TitleDisplay
```

Current reputation-based title types:

```text
Gamester
Goblin
Goonie
Fiend
```

A user must have enough Passport reputation to claim the matching title.

---

## Title Rules

Users may claim titles they have earned.

Users may equip an owned EarnedTitle into their TitleDisplay.

Black Passport users cannot claim or equip titles while restricted.

Titles are not membership.

Titles are not moderation authority.

Titles are display identity and earned recognition.

---

# Cosmetic System

Current module:

```move
module nami::cosmetics
```

Cosmetics are unlock proofs and equipped display settings.

Current objects:

```text
CosmeticUnlock
CosmeticLoadout
```

Current cosmetic types:

```text
Profile Frame
Passport Theme
Chat Overlay
Avatar Style
Badge Display
Title Effect
```

---

## Cosmetic Rules

AdminCap may grant CosmeticUnlock proofs during MVP.

Users may create a CosmeticLoadout.

Users may equip cosmetics only if they own the matching CosmeticUnlock.

Black Passport users cannot equip cosmetics while restricted.

Cosmetic unlocks do not grant reputation, membership, verification, or authority.

---

# Conduct Integration

Customization uses Conduct checks.

Black Passport means:

```text
Passport downed. Respawning in...
```

While Black Passport is active:

* Profile updates are blocked
* Title claiming is blocked
* Title equipping is blocked
* Cosmetic equipping is blocked

Black Passport should not delete existing Profiles, Titles, or CosmeticUnlocks by default.

---

# Off-Chain Media

Most customization media should stay off-chain.

Examples:

```text
Profile images
Avatar art
VTuber-style avatar config
Theme assets
Overlay images
Fonts
Long bios
Animation files
Display metadata
```

On-chain objects should store proofs and references.

---

# Current Events

Current customization-related events include:

```text
ProfileCreated
ProfileUpdated
TitleClaimed
TitleDisplayCreated
TitleEquipped
CosmeticUnlocked
CosmeticLoadoutCreated
CosmeticEquipped
```

Event field details should be kept in:

```text
docs/events.md
```

---

# Current Test Coverage

Current tests verify:

* NPC can create a public Profile
* Profile owner can update Profile
* Black Passport cannot update Profile
* User can claim a Gamester title
* User cannot claim Fiend title without reputation
* User can create TitleDisplay and equip title
* Black Passport cannot claim title
* Admin can grant CosmeticUnlock
* User can create CosmeticLoadout
* User can equip unlocked Profile Frame
* Black Passport cannot equip cosmetics

---

# Future Work

Planned improvements:

```text
Avatar customization
Profile frame marketplace
Passport themes
Chat overlays
Badge display selection
Title effects
Seasonal cosmetics
Prestige cosmetics
Guild cosmetics
Developer/game cosmetics
Cosmetic metadata registry
```

---

# Design Rules

Customization should express identity.

Customization should not create reputation.

Customization should not bypass moderation.

Customization should use off-chain media references.

Rare cosmetics may be on-chain unlock proofs.

Black Passport should pause active customization changes, not erase history by default.

---

# Frontend — Shared Chat Emojis

The signed-in app exposes a shared emoji library for all members to **use** in chat composers. Upload and removal are restricted to the **Nami Official owner** wallet (`VITE_NAMI_OFFICIAL_OWNER`).

| Role | Capability |
| --- | --- |
| Nami Official owner | Upload one or many PNG/JPG/WebP/GIF images in **Settings → Advanced → Chat Emoji Library** (max 64 emojis, 512 KB each). |
| All other members | Insert uploaded emojis from the ☺ picker beside chat composers when the library is non-empty. No upload UI is shown. |
| Future tiers | Branded emoji uploads for high tiers are planned; not enabled in the UI yet. |

Implementation: `nami-custom-emojis-store.ts`, `NamiOwnerEmojiPanel.tsx`, `ChatEmojiPicker.tsx`, `TaggedMessageBody.tsx`.

---

# Related Docs

```text
docs/passport.md
docs/reputation.md
docs/conduct-system.md
docs/access-control.md
docs/events.md
docs/admin.md
```

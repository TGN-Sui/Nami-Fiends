# Nami Architecture

## Purpose

Nami is a Sui-powered gaming identity, reputation, access, moderation, customization, and social protocol.

Nami is not only a chat app.

Nami is a portable gamer identity and trust layer for players, channels, squads, guilds, developers, creators, and future game-connected communities.

---

## Current Status

Current package:

```text
nami_chat/contracts/nami
```

Current protocol status:

```text
Build passing
55 tests passing
0 warnings
```

Current MVP progress:

```text
[██████████████░░░░░░] 71%
```

---

# Repository Structure

```text
nami_chat/
├── backend/
├── contracts/
│   └── nami/
│       ├── sources/
│       ├── tests/
│       ├── Move.toml
│       └── Move.lock
├── docs/
├── frontend/
├── sdk/
└── README.md
```

---

# Layer Responsibilities

## contracts/

The Sui Move contract layer anchors durable protocol state.

Current responsibilities include:

* Identity ownership
* Passport progression
* Verification
* Membership
* Reputation
* Badges
* Boosts
* Channels
* Channel access
* Conduct
* Moderation
* Appeals
* Jury review
* Squads
* Guilds
* Profiles
* Titles
* Cosmetics
* Recovery requests
* Admin authority

---

## docs/

The documentation layer defines the protocol model, access rules, trust boundaries, architecture, and roadmap.

Docs should stay aligned with source code.

---

## backend/

The backend will index Sui events and power user-facing views.

Planned responsibilities:

* Event indexer
* Profile service
* Passport timeline
* Badge history
* Boost history
* Channel views
* Moderation dashboard
* Appeal dashboard
* Jury dashboard
* Squad and Guild views
* Discovery engine
* Recovery review dashboard

---

## frontend/

The frontend will provide the gamer-facing app experience.

Minimum surfaces:

* Sign-in
* Create Identity
* Create Passport
* View Profile
* View Passport
* View badges
* View titles
* View cosmetics
* View Conduct Signal
* Channel pages
* Squad pages
* Guild pages
* Admin/moderation demo
* Appeal/jury demo
* Recovery request demo

---

## sdk/

The SDK will allow games, dApps, channels, guilds, and developer hubs to integrate Nami.

Planned SDK responsibilities:

* Identity reads
* Passport reads
* Profile reads
* Membership reads
* Reputation reads
* Badge reads
* Conduct reads
* Channel access checks
* Boost helpers
* Squad reads
* Guild reads
* Event subscriptions
* zkLogin helpers

---

# Current Move Modules

```text
sources/
├── admin.move
├── appeals.move
├── badge.move
├── badge_issuer.move
├── boost.move
├── channel.move
├── channel_access.move
├── conduct.move
├── cosmetics.move
├── errors.move
├── guild.move
├── identity.move
├── jury.move
├── membership.move
├── moderation.move
├── passport.move
├── profile.move
├── recovery.move
├── squad.move
├── title.move
└── verification.move
```

Current tests:

```text
tests/nami_tests.move
```

---

# High-Level Protocol Map

```text
Identity
  ↓
Passport
  ├── Verification
  ├── Membership
  ├── Reputation
  ├── Badges
  ├── Boosts
  ├── Conduct
  ├── Profile
  ├── Titles
  ├── Cosmetics
  ├── Channels
  ├── Channel Access
  ├── Moderation
  ├── Appeals
  ├── Jury
  ├── Squads
  ├── Guilds
  └── Recovery
```

Authority layer:

```text
AdminCap
  ├── Badge Issuer Approval
  ├── Membership Upgrades
  ├── Moderation Actions
  ├── Appeal Resolution
  ├── Jury Case Open / Close
  ├── Cosmetic Unlock Grants
  ├── Recovery Resolution
  └── Channel Verification
```

---

# Core Architecture Concepts

## Identity

Identity is the root ownership layer.

It should stay small, stable, and privacy-conscious.

Identity should not store progression, reputation, badges, conduct, moderation, or customization state.

---

## Passport

Passport is the player journey layer.

It stores progression, XP, level, badge points, reputation, archetype, membership tier, and future prestige hooks.

New Passports start as:

```text
NPC
```

---

## Verification

Verification controls the transition:

```text
NPC → Adventurer
```

Verification proves authenticity.

Verification does not create reputation.

---

## Membership

Membership controls feature access.

Current tiers:

```text
NPC
Adventurer
Pro
Elite
```

Membership does not equal trust or reputation.

---

## Reputation

Reputation is earned through meaningful activity.

Current reputation inputs include:

* Badge points
* XP
* Level progression

Reputation cannot be purchased.

---

## Badges

Badges are achievement and participation proofs.

Badge issuer authority protects badge quality.

Completion Badges require explicit permission.

---

## Boosts

Boosts are discovery signals.

They do not grant reputation, governance, ownership, or moderation authority.

---

## Conduct

Conduct communicates interaction style and restriction state.

Current signals:

```text
Green
Orange
Red
Black
```

Black Passport restricts active benefits.

---

## Channels

Channels are creator/community spaces.

Channels support:

* Owner
* Owner Passport ID
* Public/private setting
* Metadata reference
* Verification flag

Verified Channels are currently approved through AdminCap.

---

## Channel Access

Channel Access controls chat eligibility.

Policies are now tied to real Channel ownership.

Current policy inputs include:

* NPC chat toggle
* Minimum tier
* Minimum reputation
* Conduct status
* Moderation records

---

## Moderation

Moderation protects users and communities.

Current moderation actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

Mutes and channel bans block chat.

Black Passport globally restricts active benefits.

---

## Appeals

Appeals give users a review path after moderation actions.

Current flow:

```text
Moderation action → Appeal opened → Admin resolution
```

---

## Jury

Jury review gives trusted users an advisory voice in appeals.

Current flow:

```text
Appeal → JuryCase → Pro/Elite vote → Recommendation
```

Jury is advisory during MVP.

---

## Squads

Squads are small trust and sponsorship groups.

Current eligibility:

```text
Pro or Elite
No active Black Passport
```

---

## Guilds

Guilds are larger persistent communities.

Current eligibility:

```text
Adventurer, Pro, or Elite
No active Black Passport
```

Guilds are separate from Squads.

---

## Profiles

Profiles are public display anchors for Passports.

Profiles store references for:

* Display name
* Bio
* Avatar
* Metadata

Rich media should remain off-chain.

---

## Titles

Titles are earned display proofs.

Current title source:

```text
Passport reputation
```

Titles do not grant authority or membership.

---

## Cosmetics

Cosmetics are customization unlock proofs and equipped loadouts.

Current categories:

```text
Profile Frame
Passport Theme
Chat Overlay
Avatar Style
Badge Display
Title Effect
```

Cosmetics do not grant reputation, verification, or authority.

---

## Recovery

Recovery creates formal account-safety requests.

Current flow:

```text
Identity + Passport → RecoveryRequest → Admin resolution
```

Recovery does not transfer ownership yet.

---

# Effective Access Model

Nami avoids relying only on raw Passport tier.

Effective access may include:

```text
Passport tier
+ Conduct status
+ Channel policy
+ Moderation records
```

Black Passport forces active benefits into NPC-equivalent restrictions while active.

This affects:

* Boosts
* Channel chat
* Squad access
* Guild actions
* Jury eligibility
* Profile updates
* Title claiming/equipping
* Cosmetic equipping

---

# On-Chain vs Off-Chain Split

## On-Chain

Nami should anchor durable protocol state on-chain:

* Identity
* Passport
* Verification records
* Membership tier state
* Badges
* Badge issuer caps
* Boosts
* Channels
* Channel policies
* Conduct status
* Moderation records
* Appeals
* Jury cases
* Squad and Guild objects
* Profiles
* Titles
* Cosmetic unlocks/loadouts
* Recovery requests
* Admin actions

---

## Off-Chain

Nami should keep high-volume or private data off-chain:

* Chat messages
* Attachments
* Private moderation evidence
* Private appeal evidence
* Private jury evidence
* Private recovery evidence
* Discovery ranking
* Search
* Notifications
* Long bios
* Avatar media
* Cosmetic assets
* Analytics

---

# Current Test Coverage

Current status:

```text
55 tests passing
0 warnings
```

Tests currently cover:

* Identity and Passport creation
* NPC default tier
* Verification
* Membership upgrades
* Badge progression
* Badge issuer permissions
* Boost access
* Channel creation/update/verification
* Channel access policy ownership
* Conduct restrictions
* Moderation enforcement
* Admin authority
* Appeals
* Jury review
* Squads
* Guilds
* Profiles
* Titles
* Cosmetics
* Recovery

---

# Current Dependency Map

```text
verification.move → identity.move + passport.move

membership.move → passport.move + conduct.move

badge.move → passport.move

badge_issuer.move → badge.move + passport.move

boost.move → membership.move + passport.move + conduct.move

channel.move → membership.move + passport.move + conduct.move

channel_access.move → channel.move + membership.move + passport.move + conduct.move + moderation.move

moderation.move → passport.move + conduct.move

appeals.move → passport.move + moderation.move

jury.move → appeals.move + passport.move + membership.move + conduct.move

squad.move → passport.move + membership.move + conduct.move

guild.move → passport.move + membership.move + conduct.move

profile.move → passport.move + conduct.move

title.move → passport.move + conduct.move

cosmetics.move → passport.move + conduct.move

recovery.move → identity.move + passport.move

admin.move → badge_issuer.move + membership.move + moderation.move + appeals.move + jury.move + cosmetics.move + recovery.move + channel.move
```

---

# Future Architecture Work

Remaining major MVP layers:

```text
Backend event indexer
Frontend Passport/Profile UI
SDK helpers
zkLogin production flow
Testnet deployment scripts
Scenario/adversarial test suite
```

Future protocol modules may include:

```text
developer_identity.move
membership_record.move
guild_roles.move
discovery_anchor.move
cosmetic_registry.move
```

---

# Application Architecture (Full Site)

Nami ships as four cooperating layers. Each layer has a narrow contract with the others.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        frontend/ (React)                        │
│  Sign-in · Hub · Channels · Guilds · Chat · Profile · Settings   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP / wallet-signed uploads
┌───────────────────────────────▼─────────────────────────────────┐
│                     backend/ (Express indexer)                  │
│  Event replay · projections · media · discovery · moderation API  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Sui RPC + event subscriptions
┌───────────────────────────────▼─────────────────────────────────┐
│                   SDK/ + contracts/nami (Move)                    │
│  Identity · Passport · Cosmetics · Channels · Conduct · Admin     │
└─────────────────────────────────────────────────────────────────┘
```

## Settings UX (member vs owner)

Nami uses a **master-detail settings shell** (Discord / Slack / VS Code pattern):

| Pattern | Nami implementation |
| --- | --- |
| Shallow navigation (≤2 levels) | Left sidebar groups + one workspace pane |
| Member vs admin separation | **Your settings** vs **Owner console** sidebar groups |
| No nested tab rows | Border Art is a **direct sidebar item**, not Advanced → tab |
| Home dashboard | Compact status cards with deep links — not duplicate nav |

**Member sidebar:** Home, Account, Membership, Safety, Look & feel, Feeds, Feedback

**Owner console** (official owner wallet or Demo Perspective → Nami Official Owner):

Platform ops · **Border Art** · Visual assets · Chat emojis · Submissions · Security · Indexed data · Launch ops

Non-owners see a locked Owner console hint explaining how to unlock platform tools.

## Frontend surfaces

| Surface | Primary modules | Notes |
| --- | --- | --- |
| Game Hub | `App.tsx`, discovery stores | Genre lounges, member spotlight, channel directory |
| Channel profile | `ChannelProfileScreen.tsx`, owner settings draft | Brand media, chat, events, reviews |
| Global chat | `GlobalChatsPanel.tsx`, `messages-store.ts` | Official + genre + temporary rooms |
| Guild space | `GuildSpaceScreens.tsx` | Guild chat, roster, leadership tools |
| Member profile | `ProfileEditPanel.tsx`, passport cards | Cosmetic loadout, linked platforms |
| Settings | `SettingsScreen.tsx`, owner advanced panel | Owner dashboard + member preferences |
| Safety | `SafetyCenter` routes, report stores | Mutes, blocks, moderation intake |

## Backend services (implemented)

| Service | Role |
| --- | --- |
| `replay.ts` / projection registry | Rebuild read models from chain events |
| `passport-timeline.service.ts` | Passport activity feed including cosmetic events |
| `media-upload.service.ts` | Avatar, cover, studio logo, owner assets |
| `discovery-scoring.ts` | Multi-signal channel ranking |
| `global-chat-messages.service.ts` | Persisted global room messages |
| `officials-auth.service.ts` | Owner/moderator gate for admin routes |

## SDK responsibilities (current)

| Area | Status |
| --- | --- |
| Identity / passport reads | Implemented |
| Customization loadout parsers | Implemented (`ParsedCosmeticLoadout`) |
| Cosmetic equip transactions | Planned |
| Partner embed entrypoints | Implemented |

## Effective identity stack (runtime)

```text
Wallet session
  → Identity + Passport (chain or fixture)
    → Verification + Membership tier
      → Conduct signal
        → Channel policy + moderation records
          → Effective chat/profile/cosmetic access
```

Black Passport pauses active customization changes but does not erase unlock history by default.

---

# Chat Border Art System

Chat border cosmetics are **off-chain art** with **on-chain unlock proofs** (`cosmetics.move` → `CHAT_OVERLAY` slot). The frontend renders uploaded 9-patch frames around message bubbles.

## Authoring spec

| Constant | Value | Purpose |
| --- | --- | --- |
| Canvas | **384 × 384 px** | Square source art with transparent center |
| Art slice top | **56 px** | Includes ornate top crowns; scales with bubble width |
| Art slice right | **32 px** | Right edge patch |
| Art slice bottom | **24 px** | Bottom edge patch |
| Art slice left | **32 px** | Left edge patch |
| Display top | **28 px** | On-screen border thickness (consistent text offset) |
| Display right | **16 px** | On-screen right border |
| Display bottom | **12 px** | On-screen bottom border |
| Display left | **16 px** | On-screen left border |

**Two inset sets are required:**

* `artSliceInsets` — how the source PNG/GIF/WebP is sliced (`border-image-slice`)
* `displayWidths` — how thick the border draws on screen (`border-image-width`)

Bold or thin top framing keeps message text aligned because display top padding is fixed independent of art ornament height.

## Upload limits

| Kind | Formats | Max size |
| --- | --- | --- |
| Static | PNG, JPG, WebP | 2 MB |
| Animated | GIF, animated WebP | 4 MB |

## Reward catalog flow (testnet, off-chain)

```text
Official owner (Settings → Advanced → Border Art)
  → OfficialsRewardStudioPanel
    → define unlock condition
    → upload static/animated art + slice insets
    → wallet-signed POST /api/chat-overlay-rewards/sync
    → chat-overlay-rewards projection (server catalog + CDN art URLs)

Client bootstrap:
  official-chat-overlay-rewards-store (local defaults)
    → hydrate from GET /api/chat-overlay-rewards on test launch
    → empty server catalog falls back to four default presets (Slice 8)

Member earns unlock when condition matches:
  verified | tier-min | official-grant (member id list)
  Black Passport signal blocks unlock and equip

Member equips overlay:
  Profile edit, Settings, or Channel chat → Chat Style rail
    → saveEquippedChatOverlay() validates unlock client-side
    → member-cosmetic-equips local cache (single source of truth)
    → wallet-signed POST /api/member-cosmetics/equips/sync
    → member-cosmetic-equips projection (live cross-tab sync)

Chat render:
  ChatMessageBubble
    → resolveEquippedChatOverlayReward() (equip cache + unlock filter)
    → buildChatBorderPresentation() when art URLs exist
    → CSS fallback classes when art is null (signal-glow, wave-frame, …)
```

## Default reward presets

| Reward | Border style | Motion | Unlock |
| --- | --- | --- | --- |
| Signal Glow | `signal-glow` | static | Verified |
| Wave Frame | `wave-frame` | static | Pro tier minimum |
| Pulse Ring | `pulse-ring` | premium-loop | Elite tier minimum |
| Genesis Spark | `genesis-spark` | premium-loop | Official grant list |

## Key modules

```text
Frontend
  chat-border-art-specs.ts              — canvas + slice constants
  chat-border-art-upload.ts             — file validation + data URL reads
  official-chat-overlay-rewards-store.ts — catalog cache + default presets
  chat-overlay-rewards-sync.ts          — server catalog hydrate
  chat-overlay-catalog-sync.ts          — app-wide catalog polling + cross-tab
  chat-overlay-rewards-retry-queue.ts   — owner catalog save retry + toasts
  chat-overlay-rewards.ts               — unlock + equip resolution
  member-cosmetic-equip.ts              — validated equip save + sync enqueue
  member-cosmetic-equips-store.ts       — equip projection cache
  member-cosmetic-equip-retry-queue.ts  — optimistic sync + error toasts
  chat-border-rendering.ts              — border-image presentation builder
  ChatMessageBubble.tsx                 — chat surface wrapper (all chat UIs)
  OfficialsRewardStudioPanel.tsx        — owner Border Art studio
  ChatOverlayEquipPicker.tsx            — member equip UI

Backend (test launch)
  chat-overlay-rewards.service.ts       — catalog projection + CDN uploads
  member-cosmetic-equips.service.ts     — equip projection + catalog validation
```

## Scaling rules

* Bubble shell uses `width: fit-content` + `max-width: 100%` inside the chat grid column
* `overflow: hidden` on custom-art bubbles prevents bleed into neighboring rows
* Message stack gap (`7px` in `.message-stack`) keeps vertical separation between bordered bubbles

## On-chain alignment (future)

| Off-chain field | On-chain field |
| --- | --- |
| Reward `id` / catalog entry | `CosmeticUnlock.cosmetic_code` |
| Equipped overlay | `CosmeticLoadout.chat_overlay_code` |
| `source_code` on grant | Reward provenance (season, badge, event) |

Planned: `cosmetic_registry.move` + SDK equip PTBs + backend media CDN for border assets.

---

# Architecture Principles

Identity owns presence.

Passport owns journey.

Verification unlocks trusted entry.

Membership controls access.

Reputation is earned.

Badges prove meaningful activity.

Conduct communicates interaction state.

Black Passport restricts active benefits.

Moderation protects communities.

Appeals create fairness.

Jury adds community voice.

Squads create small trust networks.

Guilds create larger communities.

Profiles display identity.

Titles recognize earned status.

Cosmetics express style.

Recovery protects continuity.

AdminCap secures MVP authority.

Backend powers scale.

Frontend creates the gamer experience.

SDK expands the ecosystem.

Sui anchors proof.

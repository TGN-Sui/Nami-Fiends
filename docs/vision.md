# Nami Vision v1.1

Related docs: [roadmap.md](./roadmap.md) · [sui-layer.md](./sui-layer.md) · [architecture.md](./architecture.md) · [mvp-demo-flow.md](./mvp-demo-flow.md) · [border-art-ba14-walrus-quilt.md](./border-art-ba14-walrus-quilt.md)

---

## What is Nami?

Nami is a universal gaming communication, identity, trust, and discovery protocol.

Nami is not a chat application.

Nami is not a social media platform.

Nami is not a wallet, a launcher, or a handheld — though it should run inside all of them.

Nami is infrastructure that allows games, communities, studios, creators, and players to connect through a shared identity and communication layer.

Nami is designed to integrate into any game, website, launcher, platform, or application regardless of blockchain or ecosystem. The **Sui stack** is Nami's primary trust and storage foundation; hosts may live anywhere players already are.

---

## Mission

To create the world's most trusted communication and identity layer for gaming — portable across devices, surfaces, and platforms.

Nami should let a player sign in once, earn trust once, and show up everywhere: browser, extension, embedded game UI, stream overlay, SuiPlay session, or Suiball companion — without rebuilding identity per surface.

---

## Core Principles

### Identity First

Identity is the foundation of Nami.

Every interaction, achievement, reputation signal, review, earned badge, guild, and progression path originates from identity.

On Sui, identity anchors as Move objects and soulbound proofs (passport, badges, membership, conduct). Off-chain projections mirror that state for fast UI. Host surfaces read the same identity graph; none of them owns it.

See [sui-layer.md](./sui-layer.md) for the on-chain vs off-chain split.

---

### Trust Matters

Trust should be earned through participation, verification, positive contribution, and community involvement.

Trust should never be purchasable.

Conduct signals, verification tiers, jury outcomes, and reputation history should compose across hosts. A moderator action taken in the browser extension must reflect in the web Safety Center. A Black conduct block must gate chat on every surface that connects to Nami.

---

### Community Driven Discovery

Nami prioritizes community-driven discovery over advertisement-driven discovery.

Channel visibility should reflect participation, engagement, trust, and community support rather than paid promotion.

Discovery rankings index from protocol events and engagement projections — not opaque ad auctions alone. Boosts and featured placement remain bounded, auditable mechanics on top of community signal.

---

### Human-Centered Verification

Verification exists to prove humanity and establish trust while remaining accessible to legitimate players.

Verification may be achieved through approved providers such as Nami verification, verified social accounts, Sui identity systems, or future trust providers.

zkLogin lowers onboarding friction on web and embedded hosts. SuiNS may anchor names later. Suiball may eventually offer hardware-backed signing for high-trust actions without replacing zkLogin for casual chat.

---

### Progression Creates Belonging

Players should feel ownership of their gaming identity.

Nami transforms participation into a persistent progression system through levels, badges, reputation, collectibles, cosmetics, and achievements.

Cosmetics such as chat border art are moving to **Walrus Quilt** storage with on-chain catalog attestation (see [border-art-ba14-walrus-quilt.md](./border-art-ba14-walrus-quilt.md)). A border earned on web should equip on SuiPlay and render in an extension panel — same reward id, same content hash, same unlock rules.

---

## Cross-Platform Communication Infrastructure

Nami's long-term product is **cross-platform communication infrastructure** — not a single app silo.

Players, creators, and channel owners should reach each other wherever they already are: in a browser tab, inside a game, on a handheld, or from a companion device. The protocol stays the same; only the host surface changes.

```text
Sui stack (trust + ownership + storage)
        ↓
Nami protocol (identity, trust, discovery, cosmetics, access)
        ↓
Receiving server (coordination: projections, auth, payments, moderation)
        ↓
Host surfaces (web, extension, game embed, launcher, handheld, hardware)
```

### Layer responsibilities

| Layer | Owns | Does not own |
| --- | --- | --- |
| **Sui + Move** | Ownership, eligibility proofs, badge issuance, boost events, catalog attestation | Chat message bodies at scale |
| **Walrus** | Media bytes (border art, avatars, banners, attachments) | Real-time delivery |
| **Receiving server** | Projections, wallet-auth gates, officials queues, discovery index, payments | Long-term binary SoT for public cosmetics |
| **Host surface** | Layout, input, notifications, OS integration | Canonical identity or trust rules |

### What travels with the player

- One portable identity (passport, nodename, conduct, tiers)
- Shared chat, guild, and channel context (DMs and squads sync across hosts as transport matures)
- Earned cosmetics and border art (Walrus-backed media with optional on-chain catalog root)
- Discovery and reputation signals indexed from on-chain events
- Membership and verification state that gates access consistently

### What stays out of the player's way

- No requirement to understand blob IDs, epochs, or chain plumbing in everyday chat
- zkLogin and familiar sign-in paths for onboarding on web and extension
- CSS and preset fallbacks when a surface cannot yet render rich media or Walrus patches
- Hardware signing only for actions that need it (owner publish, high-value transfers) — not for reading guild chat

### Reference host vs distribution hosts

The web app shipping today is the **reference host** — the first full expression of the protocol (Hub, genre lounges, passport, owner console, Border Art studio, Launch Ops). It is not the final form factor.

Distribution hosts are thinner:

- **Extension** — notifications, quick reply, passport glance
- **Game embed** — squad strip + channel profile inside a title
- **SuiPlay shell** — full protocol UX optimized for handheld + GameOS
- **Suiball** — sign, alert, micro-interact; not a full chat client

All hosts call the same SDK contracts and projection APIs. Divergence is a bug.

### Connector pattern (`NamiHostConnector`)

Every non-web host implements a small connector contract (roadmap P3):

```text
1. Resolve session — zkLogin, wallet, or paired Suiball key
2. Hydrate identity — passport, conduct, tier, equipped cosmetics
3. Subscribe — guild/DM/channel projections (poll → push as Messaging SDK matures)
4. Render — host-appropriate chrome; protocol components stay shared where possible
5. Emit — chat send, equip, boost, report — through the same signed API paths as web
```

See [roadmap.md](./roadmap.md) intake queue: Browser extension / Steam overlay → `NamiHostConnector`; Mobile / GameOS / Suiball → Phase 10 host shells.

---

## Sui Stack as Foundation

Nami is intentionally built on the **Sui stack** so communication infrastructure can be verifiable, composable, and portable without re-centralizing trust in a single company's servers.

### Stack map

| Layer | Role in Nami | Phase / status |
| --- | --- | --- |
| **Sui L1 + Move** | Soulbound identity, badges, membership, boosts, moderation caps, chat overlay catalog attestation | Shipped — testnet package frozen for hackathon |
| **zkLogin** | Low-friction onboarding; portable sessions across web and embedded hosts | Shipped — session hardening in progress |
| **SuiNS** | Optional naming and verification anchors alongside Nami nodenames | Planned — nodenames are default gamer path |
| **Walrus + Quilt** | Durable batched media (border art, future avatars/emojis) | BA-14 shipped — aggregator read path |
| **Walrus Sites** | Decentralized hosting for the static protocol SPA | Phase 9.1 — replaces Vercel long-term |
| **Seal** | Privacy-preserving proofs and encrypted appeal/moderation evidence | Phase 9.2 |
| **Sui Groth16 / Spheres** | Eligibility proofs without exposing credentials | Phase 9.2 — evaluate as APIs stabilize |
| **MemWal** | Officials AI memory — Seal-encrypted, Walrus-backed | Phase 9.3 — not member chat |
| **Messaging SDK** | Wallet-linked E2E transport for DMs, squads, officials channels | Phase 10.1 — alpha; testnet exploratory |

On-chain state proves **who owns what, who earned what, and who may act**. Off-chain coordination provides **speed, search, chat UX, and operator tooling**. Walrus holds **bytes**. Host surfaces deliver **experience**.

Deep reference: [sui-layer.md](./sui-layer.md) (Walrus refs, Seal privacy principle, event indexing, SDK responsibilities).

### Web2 minimization

Nami's direction is to shrink web2 as system-of-record:

```text
Tier 0 — Sui stack     Move proofs + Walrus media + optional Messaging SDK transport
Tier 1 — Receiving server   JSON projections, auth, payments, moderation coordination
Tier 2 — Web2 (sunset)   Render upload disk, Vercel-only hosting, opaque media URLs
```

Border art (BA-14) is the first large Tier 2 → Tier 0 migration. Walrus Sites (Phase 9.1) moves the SPA host. Chat bodies stay off-chain at scale until Messaging SDK architecture proves fit for each channel type ([roadmap.md](./roadmap.md) Phase 10 constraints).

### Why Sui for gaming comms infra

- **Object model** — badges, passports, and caps are natural game-economy primitives
- **zkLogin** — players arrive without seed phrases; critical for extension and handheld UX
- **Fast finality** — boosts, equips, and attestations feel instant enough for live events
- **Composable events** — one indexer feeds web, extension, and SuiPlay dashboards
- **Native gaming hardware lane** — SuiPlay and Suiball extend the same stack players already use for assets and identity

Nami should feel simple for gamers while the Sui stack carries ownership, integrity, and interoperability.

---

## Host Surfaces and Distribution Plan

Nami meets players on the surfaces they already use. Each host implements the same protocol contracts through `NamiHostConnector`; none of them replaces the protocol.

### Web — reference host (now)

**Status:** Shipped — presentable MVP on testnet.

**Scope:**

- Full Hub, 23 genre lounges, Game Hub, passport, settings, owner console
- Officials Reward Studio, Border Art on Walrus (BA-14), Launch Ops, Indexed Data
- Hackathon demo console for judge walkthrough ([mvp-demo-flow.md](./mvp-demo-flow.md))
- zkLogin + wallet auth; test-launch policy on Render + Vercel

**Deploy path:** Vercel today → Walrus Sites (Phase 9.1) with the same `frontend/dist` artifact. Receiving server stays on Render (payments, webhooks, projections).

**Demo without every surface:** Dashboard Perspectives preview member tiers; CSS border presets demo cosmetics when Walrus catalog patches are not yet live; `node scripts/hackathon-demo-ready.mjs` for ops proof.

---

### Browser extension (planned — P3)

**Status:** Roadmap — after StreamOverlay connector.

**Why:** Streamers, moderators, and multi-tab players need Nami beside the game or stream, not only inside nami.app.

**Planned capabilities:**

- Session handoff from web zkLogin (shared storage policy TBD — secure extension storage + refresh)
- DM and guild notification toasts with one-click reply
- Passport + conduct glance overlay
- Equip border / badge without leaving the active tab
- Moderator quick actions (mute, report, jury queue depth) for entrusted roles
- Optional Steam overlay / browser-source bridge for OBS ([roadmap.md](./roadmap.md) OBS overlay lane)

**Architecture:** Thin React or Lit panel bundle + `NamiHostConnector`; shares `@nami/sdk` and projection polling with web. Does not duplicate Move package reads.

**Sui stack touchpoints:** zkLogin session, wallet-signed API calls, Walrus aggregator URLs for equipped border previews.

---

### Game and launcher embeds (planned — P2/P3)

**Status:** SDK foundation exists; embed contracts harden with partner intake.

**Why:** Studios should add Nami squad chat and channel discovery without rebuilding identity.

**Planned capabilities:**

- iframe or WebView embed: channel profile, squad roster, lightweight chat strip
- Deep link back to full Nami host for passport and settings
- Optional `@nami/sdk` native bindings for Unity / Godot / custom launchers
- Verification and conduct gates enforced server-side — embed cannot bypass Black signal

**Works with or without the game on Sui:** Non-Sui titles still use zkLogin or linked wallet; on-chain proofs remain on Sui regardless of game chain.

**Sui stack touchpoints:** Move membership/badge gates, indexer projections, future Seal proofs for age-gated channels.

---

### SuiPlay 0X1 (planned — Phase 10)

**Status:** Deferred until Phase 8 exit + Phase 10 gate — first-class target, not day-one ship.

**What SuiPlay is:** Mysten's handheld gaming device (Steam Deck–class) with GameOS, multi-store support, and Sui-native game catalog. Nami treats it as a **primary gaming surface**, not an afterthought port.

**Planned integration depth:**

| Depth | Examples |
| --- | --- |
| **Shallow** | Open Nami PWA / Walrus Sites URL in device browser; same as web |
| **Medium** | Installed shell app: Hub, genre lounge, passport optimized for handheld layout |
| **Deep** | GameOS widgets: passport card on home, achievement strip, verified channel badge on store pages, native notification for guild @mentions |

**Player story:** Earn a border on web → equip in SuiPlay chat → same `contentHash` resolves via Walrus aggregator on device. Join a MOBA genre lounge on handheld → same room id as desktop ([global-chats.ts](../frontend/src/global-chats.ts) genre registry).

**Questionnaire alignment:** Developer intake already asks SuiPlay / GameOS interest ([questionnaire.md](./questionnaire.md)) — vision commitment is to support those integrations as the device ecosystem matures.

**Dependencies:** Messaging SDK or resilient poll transport for mobile background; Walrus Sites or testnet CDN for SPA; zkLogin redirect URIs on device browser origin.

---

### Suiball (planned — Phase 10)

**Status:** Deferred — companion hardware lane, not full chat host.

**What Suiball is:** Sui-native hardware wallet (Citadel stack) — secure element, BLE/NFC, wearable form factor, micro-apps for Sui, Walrus, gaming, and identity ([suiball.com](https://www.suiball.com)).

**Nami's role on Suiball:**

| Role | Description |
| --- | --- |
| **Signing** | High-trust actions: owner catalog publish, treasury tips, membership checkout confirmation |
| **Alerts** | Haptic / OLED notification for DM, guild invite, jury duty, boost confirmation |
| **Quick reply** | Canned responses or emoji react — not full thread UI on 1.75" display |
| **Identity glance** | Nodename, tier, conduct color on micro-app home |
| **Verification anchor** | Future: prove hardware-backed possession for elite moderator or officials roles |

**What Suiball is not:** A replacement for SuiPlay or web chat. Suiball stays in the **trust + notification** band of the architecture.

**Sui stack alignment:** Suiball already ships micro-apps for Walrus, SuiNS, and gaming — Nami catalog attestation and border patch refs fit naturally as verified media consumers.

---

### SuiPlay × Suiball — better together

SuiPlay and Suiball solve different jobs; Nami connects them through one identity graph.

```text
SuiPlay 0X1          Suiball
(full game + chat)   (sign + alert + micro-UX)
       \                /
        \              /
         Nami protocol
    (one passport, one conduct, one cosmetic loadout)
              |
         Sui + Walrus
```

**Example session:**

1. Player zkLogins on SuiPlay shell → passport hydrates from indexer.
2. Guild leader sends @mention → Suiball vibrates; quick-reply "omw" signed via NFC tap.
3. Player equips new border from reward drop → Walrus patch ref in projection; SuiPlay chat renders; Suiball shows thumbnail on identity micro-app.
4. Channel owner publishes catalog update → Suiball confirms wallet signature; attestation PTB lands on Sui (post-hackathon package upgrade).

Neither device owns the protocol. Both consume the same projections and aggregator URLs.

---

### Mobile web / native shell (planned — Phase 10)

**Status:** Deferred — standalone mobile genre chat experiment gated behind Phase 10.1.

**Scope:** PWA or React Native shell focused on genre lounges and DMs; maps `canSendChatMessages` and verification rules to Messaging SDK channel policy when ready.

**Not in scope for first mobile experiment:** Replacing the shipped web Hub; duplicating owner console on phone.

See [roadmap.md](./roadmap.md) Phase 10.1 for Messaging SDK constraints (alpha, testnet, high-volume lounge architecture).

---

### Stream overlays (planned — P2)

**Status:** Roadmap — OBS browser source after super-banner and tutorial polish.

**Scope:** Chat strip, gift animations, equipped border frame mirrored for stream audience; streamer toggles what viewers see.

**Connector:** Extends `NamiHostConnector` with broadcast-safe layout; pairs with browser extension for capture.

---

## Phased delivery

Surfaces are phased; the **protocol and identity graph are not**.

```text
Phase 1–8   Web reference host + receiving server + Move package (now)
Phase 9     Walrus Sites SPA, Seal proofs, MemWal officials AI
Phase 10    Messaging SDK, extension, SuiPlay / Suiball / mobile hosts
```

| Milestone | User-visible outcome |
| --- | --- |
| **Now (hackathon)** | Web MVP + Walrus border art + frozen Move package + demo console |
| **Phase 9.1** | Protocol SPA on Walrus Sites; Vercel no longer required for static host |
| **Phase 9.2–9.3** | Private evidence and officials AI memory on Seal + Walrus |
| **Phase 10** | Extension + SuiPlay shell + Suiball alerts; SDK transport for DMs/squads |

Full schedule: [roadmap.md](./roadmap.md).

---

## Long-Term Vision

Nami becomes the default communication, identity, trust, and discovery layer integrated across the global gaming ecosystem — **on the Sui stack and on every surface players touch**.

Players carry their identity wherever they play.

Communities build trust that persists beyond individual games.

Developers gain direct access to their audiences without relying on traditional social platforms.

Cross-platform communication infrastructure means a guild formed in a browser MMO is still the same guild on a SuiPlay session, in a partner game's embed, in a moderator's extension panel, and on a Suiball notification — one protocol, many hosts, Sui-backed proof underneath.

### Success looks like

- A creator equips a Walrus-backed border on web; every host renders it from the aggregator without re-upload
- A Sui game on SuiPlay shows Nami verified channel badge from the same indexer row as the web Hub
- A moderator resolves a report in-extension; conduct projection updates before the player returns to desktop chat
- A player zkLogins once; session policy allows extension and web without duplicate onboarding
- Official owner catalog attestation on Sui matches the Walrus quilt `contentHash` map — judges and partners can verify without trusting Render disk

### What we will not do

- Become a closed social network that traps communities inside one app
- Sell trust, conduct, or verification tier bypass
- Force every chat message on-chain at lounge scale before architecture proves sustainable
- Tie Nami identity to a single hardware vendor — SuiPlay and Suiball are partners in the plan, not exclusivity gates

---

## The Nami Ecosystem

```text
Identity
   ↓
Trust
   ↓
Discovery
   ↓
Community
   ↓
Progression
   ↓
Cross-platform hosts
   web → extension → game embed → stream → SuiPlay → Suiball
   ↓
Sui stack (Move · Walrus · Seal · Messaging SDK · zkLogin · SuiNS)
```

These systems work together to create a living gaming network where reputation, participation, and contribution have lasting meaning — verified on Sui, experienced everywhere.

---

## Document history

| Version | Date | Change |
| --- | --- | --- |
| v1.0 | — | Initial vision — identity, trust, discovery, progression |
| v1.1 | 2026-06-26 | Cross-platform comms infra, Sui stack map, SuiPlay / Suiball / extension plan, connector pattern, doc links |
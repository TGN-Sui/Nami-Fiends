# Nami Chat UI Build Checkpoint

Status: UI build checkpoint complete through UI-A20.5; Phase 7 intake UI-B21.1–UI-B21.12 in progress.

This checkpoint records the completed frontend UI polish pass for Nami Chat and the active Phase 7 product surfaces. It confirms the current UI build is clean, visually reviewed, and aligned with the project rule that paid features add capability or customization only and never create verification or trust.

## Completed UI Scope

| Phase | Status | Result |
| --- | --- | --- |
| UI-A19 | Complete | Member Spotlight and sidebar avatar polish. |
| UI-A20.1 | Complete | Ownership mode clarity for owner/member preview states. |
| UI-A20.2 | Complete | Channel Palette member flow with dots-only color selection. |
| UI-A20.3 | Complete | Owner tool action states for operational controls. |
| UI-A20.4 | Complete | Final responsive and accessibility polish. |
| UI-A20.5 | Complete | UI build checkpoint and documentation cleanup. |

## Phase 7 Intake (UI-B21)

| Phase | Status | Result |
| --- | --- | --- |
| UI-B21.1 | Complete | Account sign-in relocated to Settings. |
| UI-B21.2 | Complete | Theme modes: Nami Default, Dark, Light, Custom. |
| UI-B21.3 | Complete | Nami Hub global chats + Elite temporary rooms. |
| UI-B21.4 | Complete | Game Hub genre browser + bottom chat dock. |
| UI-B21.5 | Complete | Embedded social panels (X, Twitch/live). |
| UI-B21.6 | Complete | Passport ↔ Badge Collectors Book swipe carousel. |
| UI-B21.7 | Complete | TCG-style member passport when viewing others. |
| UI-B21.8 | Complete | Membership checkout + backend payment intents API. |
| UI-B21.9 | Complete | Pinned top-right profile avatar with foil + photo. |
| UI-B21.10 | Complete | Live-streaming dot on avatars (top-right inset). |
| UI-B21.11 | Complete | TCG passport vertical layout + tier header polish. |
| UI-B21.12 | Complete | Chat emojis, @tags, notifications, social embeds. |

## Latest UI Commits

| Commit | Summary |
| --- | --- |
| latest | Phase 7 payments, pinned avatar, passport polish, chat tags |
| `dd918d4` | Add Phase 7 UI, owner-only admin caps, membership billing |
| `57746d0` | Add final responsive accessibility polish |
| `a437426` | Polish owner tool action states |
| `57ac68e` | Polish channel colors member flow |
| `3974d4d` | Mount ownership mode clarity UI |
| `6b974b5` | Add ownership mode clarity |
| `aea188d` | Refine member spotlight foil sweep |
| `eac3938` | Polish member spotlight foil effects |

## Verification Commands

The checkpoint was verified with:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
```

Both checks passed.

## Product Rules Preserved

- Paid placement, paid subscriptions, Pro, and Elite features do not create verification or trust.
- Verification remains based on identity proofs, SuiNS/subnames, badges, reputation, and approval systems.
- Member Spotlight excludes NPC/Black status members and keeps verified checkmarks reserved for valid verified member states.
- Channel Colors are member-facing cosmetic selections from owner-approved palette options.
- Owner tools are operational controls only. They do not override Nami-controlled proofs, verification, or trust decisions.
- Media upload controls remain preparation surfaces until live authorization and storage persistence are implemented.

## UI Build Outcome

Phase 7 surfaces are active. Membership checkout, subscription state, avatar uploads, and streaming presence now sync through the backend receiving server when `VITE_NAMI_INDEXER_URL` is set.

Recommended next lane:

1. Wire cross-user subscription proofs to on-chain tier updates (shared passport or delegated fulfillment cap).
2. Phase 8 launch prep: testnet live, security review, production dashboards.
3. Extend Walrus-backed media references when storage proofs ship.
4. Continue avoiding any wording that implies payment equals trust.


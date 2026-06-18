# Nami Chat UI Build Checkpoint

Status: **Phase 7 complete** — UI-A20.5, UI-B21.1–UI-B21.22, and test-launch polish slices 1–10 landed (`347511f`).

This checkpoint records the completed frontend UI polish pass for Nami Chat, the shipped Phase 7 product surfaces, and the unified architecture prepared for test launch. It confirms the current UI build is clean, provider-backed where the receiving server is live, and aligned with the project rule that paid features add capability or customization only and never create verification or trust.

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
| UI-B21.22 | Complete | Cross-user AdminCap fulfillment for queued subscriber passports. |

## Test-Launch Polish (Slices 1–10)

| Slice | Status | Result |
| --- | --- | --- |
| Slice 1 | Complete | `app-config`, `protocol-availability`, preference/safety stores, `ProtocolStatusBar`. |
| Slice 2 | Complete | Removed dead demo UI (`UxPreviewConsole`, `MediaUploadPrepCard`, demo tag seed mount). |
| Slice 3 | Complete | `domain/types` + `fixtures/seed-data`; gated `uiMockData` facade. |
| Slice 4 | Complete | `preferences-sync` + `media-upload-service` unified upload paths. |
| Slice 5 | Complete | `affiliation-provider` for guild/squad surfaces. |
| Slice 6 | Complete | Auto-seed gated by `VITE_NAMI_TEST_LAUNCH`. |
| Slice 7 | Complete | `channel-directory-provider` + `member-directory-provider` for Hub / Game Hub. |
| Slice 8 | Complete | Mock checkout and X verification gated behind dev/test policy. |
| Slice 9 | Complete | `IndexedDataPanel` official-owner gate; user-facing protocol copy cleanup. |
| Slice 10 | Complete | Roadmap + checkpoint docs; Phase 7 marked complete. |

## Landing Page Polish

| Commit | Summary |
| --- | --- |
| `6c869e0` | Landing TCG deck, hero visual, uniform horizontal passport, no guest browse |
| `2a66666` | Deck animation, floating genre bubbles, hero passport layout |
| `e9881a1` | Elite passport + glitter, wider cards, deck shift on discard only |
| `85ef2dc` | TCG 2.5″×3.5″ sizing, table overlap, white grid spotlight, varied bubbles |
| `7858c6e` | Sharper spotlight falloff |
| `2858b5f` | Spotlight bloom aligned to cursor pixels |

| `064822d` | Native TCG passport fit, three-card stack, hero headline, landing copy docs |

Copy for the landing page is centralized in `frontend/src/landing-content.ts`. See [landing-page.md](./landing-page.md).

## Post-Phase 7 UI Polish (Game Hub + Profile)

| Area | Summary |
| --- | --- |
| Navigation | Pages scroll to top on every `activePage` change. |
| Ambient | `NamiGridSpotlight` extends landing cursor spotlight to the signed-in app shell. |
| Genre chat | Centered expand overlay; heading/messages no longer overlap. |
| Profile passport | Horizontal carousel centered; avatar/name overlap fixed. |
| Memberships list | Fixed table columns; aligned Open / Invite action grid. |
| My Events | Footer rows aligned (Interested + channel / view actions). |
| Member pinned chat | Compact mode skips presence rail; composer stays visible. |
| Badge Book | Single-scale closed cover, 3D open animation, frame-by-frame spread flips. |

Latest commit for this wave: `8267009` — Polish Game Hub surfaces and interactive Badge Book.

## Latest UI Commits

| Commit | Summary |
| --- | --- |
| `347511f` | Slice 9 operator UX + Hub fixture fallback during discovery load |
| `fdc78bf` | Slice 8 payment/X gating + Game Hub empty-state fix |
| `bda07a4` | Slice 7 channel and member directory providers |
| `7482c2b` | Slice 6 gate local store auto-seeding |
| `413a989` | Slice 5 affiliation provider |
| `9d74b90` | Slice 4 preferences sync + media uploads |
| `71e8b19` | Slice 3 domain types vs fixtures |
| `80cc9f8` | Slice 2 remove dead demo UI |
| `5b32205` | Slice 1 app config + unified stores |
| `dd918d4` | Add Phase 7 UI, owner-only admin caps, membership billing |
| `57746d0` | Add final responsive accessibility polish |
| `a437426` | Polish owner tool action states |
| `57ac68e` | Polish channel colors member flow |
| `3974d4d` | Mount ownership mode clarity UI |
| `6b974b5` | Add ownership mode clarity |
| `aea188d` | Refine member spotlight foil sweep |
| `eac3938` | Polish member spotlight foil effects |
| `f95e69f` | Phase 7 UI-B21 surfaces, guild spaces, spotlight layout polish |
| `324833e` | Cross-user AdminCap membership fulfillment |

## Verification Commands

Phase 7 completion was verified with:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend test
```

All checks passed (47 unit tests at completion).

## Product Rules Preserved

- Paid placement, paid subscriptions, Pro, and Elite features do not create verification or trust.
- Verification remains based on identity proofs, SuiNS/subnames, badges, reputation, and approval systems.
- Member Spotlight excludes NPC/Black status members and keeps verified checkmarks reserved for valid verified member states.
- Channel Colors are member-facing cosmetic selections from owner-approved palette options.
- Owner tools are operational controls only. They do not override Nami-controlled proofs, verification, or trust decisions.
- Media uploads route through `media-upload-service` when the receiving server is configured; Walrus proofs remain a later phase.

## Architecture Notes (Test Launch)

- **Config:** `app-config.ts` centralizes env flags (`VITE_NAMI_DEV_FIXTURES`, `VITE_NAMI_TEST_LAUNCH`, indexer URL).
- **Protocol status:** `protocol-availability.ts` exposes Connected / Online / Preview / Setup badges (no user-facing “Mock” label).
- **Providers:** `affiliation-provider`, `channel-directory-provider`, `member-directory-provider` unify live indexer data vs fixture fallback.
- **Fixture policy:** Dev fixtures stay on during polish; live discovery replaces them only when ranked rows return. Hub and Game Hub show fixtures immediately (including while discovery loads).
- **Operator tools:** `IndexedDataPanel` is visible only to `VITE_NAMI_OFFICIAL_OWNER` in Settings → Advanced.

## UI Build Outcome

Phase 7 is complete. Membership checkout, subscription state, avatar/cover/logo uploads, streaming presence, and directory surfaces sync through the receiving server when `VITE_NAMI_INDEXER_URL` is set, with fixture fallback for offline or empty discovery cycles.

**Phase 8 is unblocked.** Recommended next lane:

1. Testnet deployment and launch ops (security review, moderation dashboards, analytics).
2. Extend Walrus-backed media references when storage proofs ship.
3. Continue avoiding any wording that implies payment equals trust.


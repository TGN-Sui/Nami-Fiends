# Social Linking

**Implemented today:** Official X/Twitch OAuth for game studio onboarding (`GameOfficialSocialAuthControl.tsx`) and gamer onboarding (`gamer-official-social-auth-store.ts`). Platform links for members live in Settings → Account (`PlatformLinkSettingsPanel.tsx`).

See [game-onboarding.md](./game-onboarding.md), [onboarding.md](./onboarding.md), and [verification.md](./verification.md).

---

## Core Flow Summary (Aligned with Existing Onboarding)
For Members (Gamers):

In profile/settings → "Link Game Accounts".
Select platform (Steam, Epic, etc.) → Redirect to official OAuth/consent flow.
Explicit approval prompt on the platform side: "Nami Gems wants to read your library, achievements, and playtime. Allow?"
On success: Data registered in Nami (encrypted/secure storage).
Initial sync: Full library + current achievements.
Ongoing: Periodic updates (webhooks where available, or scheduled polls with user consent).

Gems appear automatically in collection as conditions are met (no manual claim needed for supported platforms).

For Game Owners/Studios (in Post-Approval Badge Wizard):

Enhanced Condition Definition now includes:
"Platform Integration Mode": Steam Achievements / Epic / Custom API / Manual (fallback).
Mapping: Specific achievement IDs, playtime thresholds, library ownership checks, etc.
Automation Rules: e.g., "On Steam achievement unlock X → upgrade to Stage Y".

Trust Score influences automation level (higher trust = faster/more autonomous approvals for new conditions).

Technical Automation Backbone (High-level):

Secure OAuth + scoped permissions (read-only where possible).
Backend worker/indexer monitors linked accounts.
When a matching condition fires (via webhook/poll): Authorized GameBadgeAuthority mints/upgrades the Gem object on Sui for the linked Sui wallet.
One Gem per game per player (upgradeable) — prevents multi-character spam.
Privacy: Users control linked accounts, can unlink anytime (revokes future updates), data minimized to what's needed for badge logic.
Fallbacks: For non-supported platforms or manual verification, studios can still trigger via their backend.

This integrates cleanly with the Studio Portal UI Flow (Badge Management Wizard now has a dedicated "Automation & Platform Mappings" tab) and QUESTIONNAIRE-EXPANDED.md (added questions in Section 10 for integration preferences).
Updated/Impacted Existing Docs

STUDIO-PORTAL-UI-FLOW.md now references the new linking/automation details in the post-approval wizard.
EXAMPLE-CONDITION-MAPPINGS.md includes new automation-focused examples.
TRUST-SCORE-RULES.md gives bonus points for studios that support deep platform integrations (stronger anti-farming signals).

All files remain focused on the badge system as requested.
Ready for review or iteration. Let me know if you want:

JSON schemas for the updated forms (linking + condition mapping).
Deeper technical specs (OAuth flows, webhook examples, Move contract hooks).
Refinements to any part of the automation logic.
Or the next priority in the badge/questionnaire area.

This keeps the system automated, user-friendly, and farm-resistant while giving studios powerful tools.
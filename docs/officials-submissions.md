# Nami Officials Submissions

Nami Officials review inbound submissions from a unified queue in **Settings → Advanced → Submissions** (`NamiOfficialsSubmissionsPanel.tsx`). The Security tab retains nodename claims, moderators, and enforcement only.

Official owner access is gated by `isOfficialOwner()` / `nami-capabilities.ts`.

---

## Queues

| Tab | Source store | Review actions |
|-----|--------------|----------------|
| **Suggestions** | `nami-user-suggestions-store.ts` | Mark reviewed, Archive |
| **Game tickets** | `game-submission-ticket-store.ts` | Pre-approve, Approve, Reject |
| **Partner banners** | `partner-banner-submission-store.ts` | Approve, Reject |

Pending counts appear on each tab label. Storage keys:

```text
nami.user.suggestions
nami.game.submission.tickets
nami.partner.banner.submissions
```

---

## User suggestions

**Submit:** Settings → **Feedback** (`UserSuggestionsSettingsPanel.tsx`)

- All users can send suggestions (minimum 10 characters).
- Submitter name, email (if signed in), and surface role are attached.
- Users see their five most recent submissions with status.

**Review:** Officials mark `submitted` → `reviewed` or `archived`.

---

## Game tickets

Submitted from game onboarding (`GameOnboardingPanel.tsx`).

- Sorted by Trust Score descending.
- Preview shows contact, genres, social links, store URLs (filled fields only).
- Phone is never shown to officials.
- **Approve** triggers approval email, welcome overlay queue, and hidden event release.

---

## Partner banner submissions

Submitted when a channel owner completes partner carousel checkout (`channel-owner-promotions-store.ts` → `confirmPromotionPurchase`).

- Central queue syncs via `nami-partner-banner-ticket-updated` event.
- Officials see title, description, duration, cover preview, channel name.
- **Approve** sets expiry from duration and syncs back to channel promotions when the owner session is on the same device.

---

## Navigation

| Role | Path |
|------|------|
| Any member | Settings → Feedback |
| Game studio | Game onboarding → Submit ticket |
| Channel owner | Owner tools → Partner Banner → Submit ticket for approval |
| Nami Official owner | Settings → Advanced → Submissions |

---

## Related

- [admin.md](./admin.md)
- [game-onboarding.md](./game-onboarding.md)
- [Trust-Score_rules.md](./Trust-Score_rules.md)
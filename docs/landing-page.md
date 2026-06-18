# Landing Page

The public entry surface lives in `frontend/src/EntryPage.tsx`. Marketing copy is centralized in `frontend/src/landing-content.ts` so you can edit text without touching layout code.

## Edit landing copy

Open:

```text
frontend/src/landing-content.ts
```

| Export | Used for |
| --- | --- |
| `LANDING_HERO` | Hero eyebrow, headline, description (`subhead`), trust note |
| `LANDING_SCENARIOS` | TCG scenario deck cards (`title`, `pain`, `namiWay`, `outcome`) |
| `LANDING_GENRE_LOUNGES` | 23 official IGDB genre lounge labels (chips, Game Hub genre chats, floating bubbles) |
| `LANDING_PILLARS` | “What Nami is” pillar cards (`id`, `index`, `tag`, `title`, `detail`, optional `variant: 'featured'`) |
| `LANDING_STEPS` | Three-step onboarding section |
| `GAME_HUB_INTRO` | Game Hub intro after entering Nami |

Current hero headline:

```text
One Identity. Every Game.
```

After saving, refresh the dev server to see changes.

## Copy still in `EntryPage.tsx`

These strings are wired directly in the page shell (not in `landing-content.ts`):

- CTA button label (“Enter Nami. It’s free to start”)
- Hero stat chips (Passport / Channels / Genre chats)
- Signed-out notice
- Section headings outside the hero block

Change those in `frontend/src/EntryPage.tsx` when you need different button or stat labels.

## Visual components

| File | Role |
| --- | --- |
| `LandingHeroVisual.tsx` | Three-passport hero collage (Official center, Elite left, Pro right) |
| `LandingScenarioDeck.tsx` | Draw / flip / discard TCG scenario deck |
| `LandingGenreBubbleField.tsx` | Floating genre lounge bubbles |
| `LandingGridSpotlight.tsx` | Cursor-aligned white grid spotlight |
| `phase7-ui.css` | Landing layout, TCG card sizing, spotlight, bubbles |

## Behavior notes

- Guest browse is disabled; signup is the only entry CTA on the landing page.
- Sign out clears the session and returns here (`2e30f38`).
- Mobile shows the Official Nami passport only; desktop shows the full three-card stack.

## Verify locally

```bash
cd frontend
npm run typecheck
npm test
npm run dev
```

Open the app entry route and confirm hero copy, scenario deck, and passport collage render as expected.
# Nami Frontend

## Purpose

The frontend is the gamer-facing Nami app: landing page, onboarding, Passport/Profile UI, Game Hub, channels, and chat surfaces.

## Landing page copy

Edit marketing text in:

```text
frontend/src/landing-content.ts
```

See [docs/landing-page.md](../docs/landing-page.md) for the full map of exports (`LANDING_HERO`, scenarios, pillars, steps, and Game Hub intro).

Layout and behavior live in `EntryPage.tsx` and the `Landing*.tsx` components.

## Current Status

Current frontend capabilities:

- Vite + React + TypeScript setup
- Public landing page with TCG scenario deck and passport hero visual
- Public Profile preview
- Passport summary preview
- Membership display
- Conduct Signal display
- Badge display
- Title display
- Cosmetic display
- Channel preview
- Package ID input
- Wallet address input
- Wallet / zkLogin / demo onboarding placeholder
- Network and package configuration display

Protocol wiring to Sui is partial; indexer-backed providers fall back to fixtures when offline.

## Setup

```bash
cd frontend
npm install
npm run dev
```

## Verify

```bash
npm run typecheck
npm test
npm run build
```
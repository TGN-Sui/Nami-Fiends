# Nami MVP Smoke Checklist

## Purpose

This checklist verifies that the current Nami MVP stack is healthy before deeper adversarial testing.

The goal is to confirm that contracts, backend, SDK, frontend, deployment outputs, and local environment wiring are all working together.

---

## Current Expected Status

```text
Move build: passing
Move tests: 80 passing
Frontend unit tests: 133 passing
Warnings: 0
Backend typecheck: passing
SDK typecheck/build: passing
Frontend typecheck/build: passing
Testnet deployment output: present
```

---

## Frontend smoke (Phase 8)

| Check | Path |
|-------|------|
| Enter Nami gate opens from Hub CTA | Landing → Enter Nami |
| Gamer onboarding completes | Enter Nami → Gamer |
| Game ticket preview shows filled fields | Game onboarding → Review |
| Suggestion submits | Settings → Feedback |
| Game ticket in officials queue | Advanced → Submissions → Game tickets |
| Partner banner in officials queue | Owner tools → Partner Banner → Submit |
| Pre-approved owner sees sidebar + profile | Enter pre-approved channel |

Docs: [game-onboarding.md](./game-onboarding.md), [officials-submissions.md](./officials-submissions.md).

---

## Commands

```bash
cd contracts/nami && sui move test
cd frontend && npm run typecheck && npm test && npm run build
```
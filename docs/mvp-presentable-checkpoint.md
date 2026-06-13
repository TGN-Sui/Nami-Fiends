# Nami MVP Presentable Checkpoint

## Status

Nami has reached a presentable MVP checkpoint.

This does not mean Nami is production-ready.

It means the core protocol, documentation, deployment path, backend foundation, SDK foundation, frontend foundation, environment sync, onboarding placeholder, demo flow, and MVP smoke checks are assembled and passing.

---

## Current MVP Status

```text
Move build: passing
Move tests: 55 passing
Move warnings: 0

Backend typecheck: passing
SDK typecheck: passing
SDK build: passing
Frontend typecheck: passing
Frontend build: passing

Testnet deployment output: present
Environment sync: passing
MVP smoke check: passing
Wallet / zkLogin onboarding placeholder: present
MVP demo flow: present
```

---

## Current MVP Progress

```text
Nami Presentable MVP Progress

[████████████████████] 100%
```

---

## Current Repository Layers

```text
contracts/     Sui Move protocol
backend/       Event indexer foundation
sdk/           Read helper foundation
frontend/      Passport/Profile UI foundation
docs/          Architecture and operating model
deployments/   Testnet deployment records
scripts/       Publish, env sync, MVP check, demo helpers
```

---

## Current Protocol Systems

Implemented Move systems:

```text
Identity
Passport
Verification
Membership
Reputation
Badges
Badge Issuers
Boosts
Channels
Channel Access
Conduct
Moderation
Admin Authority
Appeals
Jury
Squads
Guilds
Profiles
Titles
Cosmetics
Recovery
Errors
```

---

## Current Product Surface

The MVP currently demonstrates:

```text
Portable gamer identity
Passport-based progression
Membership access tiers
Earned reputation
Conduct Signals
Black Passport restriction model
Channel creation and access policies
Moderation records
Appeals
Advisory jury review
Squads
Guilds
Public Profiles
Earned Titles
Cosmetic unlocks/loadouts
Recovery requests
Frontend onboarding placeholder
Backend event indexing foundation
SDK read helpers
Testnet deployment path
Environment sync
MVP smoke check
MVP demo flow
```

---

## Current Testnet Deployment

Deployment summary location:

```text
deployments/testnet/latest.json
```

Expected fields:

```text
network
packageId
adminCapId
publishedAt
publishDigest
```

Local environment files can be regenerated with:

```bash
bash scripts/sync-testnet-env.sh
```

---

## MVP Verification Command

Run from repo root:

```bash
bash scripts/mvp-check.sh
```

Expected result:

```text
Nami MVP Check Complete
```

This verifies:

```text
Move build
Move tests
Backend typecheck
SDK typecheck
SDK build
Frontend typecheck
Frontend build
Deployment summary
```

---

## Demo Command

Run from repo root:

```bash
bash scripts/mvp-demo-info.sh
```

Then run the frontend:

```bash
npm --prefix frontend run dev
```

Open:

```text
http://localhost:5173
```

---

## What This MVP Is

This MVP is a protocol-first proof that Nami can support:

```text
Gaming identity
Portable Passport state
Earned reputation
Access control
Conduct-aware benefits
Moderation and appeals
Community voice through jury review
Small trust groups through Squads
Large communities through Guilds
Profile and customization layers
Recovery request flows
Event indexing
SDK reads
Frontend presentation
Testnet deployment
```

---

## What This MVP Is Not Yet

This MVP is not yet:

```text
Production-ready
Security-audited
Fully wallet-wired
Fully zkLogin-wired
Fully backend-indexed into app views
Live chat infrastructure
Final UI design
Final admin dashboard
Final moderation dashboard
Final recovery security model
```

---

## Known Intentional Limits

Current intentional limits:

```text
Recovery does not transfer ownership yet.
Jury recommendations are advisory.
AdminCap is the MVP authority model.
SDK is read-only.
Frontend uses sample display data.
Backend stores local JSONL event output.
Break-the-System suite has not started yet.
```

These limits are intentional.

They should be hardened before production launch.

---

## Next Required Phase

The next required phase is:

```text
Break-the-System adversarial suite
```

The goal is to intentionally attack the protocol before deeper UI polish or production launch.

Initial adversarial targets:

```text
Wrong owner attempts
Wrong Passport / Conduct pairing
Black Passport bypass attempts
Invalid tier transitions
Invalid badge issuer permissions
Invalid channel policy ownership
Moderation bypass attempts
Appeal ownership abuse
Jury eligibility abuse
Squad authority abuse
Guild authority abuse
Profile update abuse
Title ownership abuse
Cosmetic ownership abuse
Recovery abuse paths
Admin authority misuse attempts
```

---

## Checkpoint Decision

Nami is ready to move from:

```text
MVP Assembly
```

to:

```text
MVP Hardening
```

The next phase should prioritize correctness, abuse resistance, and adversarial tests before adding major new features.

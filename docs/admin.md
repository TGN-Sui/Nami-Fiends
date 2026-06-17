# Nami Admin Authority

## Purpose

Admin Authority controls sensitive protocol actions during the MVP phase.

AdminCap is the current authority object used to safely expose actions that should not be callable by ordinary users.

AdminCap is not the final governance model.

It is the MVP safety layer.

---

## Current Status

Current module:

```move
module nami::admin
```

Current protocol status:

```text
77 tests passing
0 warnings
Phase 1 + Phase 1.8 (Break-the-System hardening): complete
```

Phase 2 indexer surfaces (read-only HTTP) expose admin-adjacent projections:

```text
Appeals, jury cases, moderation records, recovery requests
backend/src/server.ts · default http://127.0.0.1:8787
```

AdminCap currently connects to:

```text
badge_issuer.move
membership.move
moderation.move
appeals.move
jury.move
cosmetics.move
recovery.move
channel.move
passport.move
conduct.move
```

---

# AdminCap

Current object:

```move
AdminCap
```

Purpose:

Allows the holder to perform sensitive protocol actions.

Current creation paths:

```text
Package init
Test-only init_for_testing
```

In production, AdminCap custody must be handled carefully.

---

# Current Admin Powers

AdminCap currently supports:

```text
Approve badge issuer
Upgrade to Pro
Upgrade to Elite
Issue warning
Issue mute
Issue channel ban
Issue Black Passport
Resolve appeal
Open jury case
Close jury case
Grant cosmetic unlock
Resolve recovery request
Verify channel
```

These actions emit `AdminAction` events for indexing and audit trails.

---

# Badge Issuer Authority

AdminCap can approve BadgeIssuerCap objects.

Related module:

```move
module nami::badge_issuer
```

Purpose:

Controls who may issue badges.

Current issuer permissions:

```text
Can issue Basic Badge
Can issue Event Badge
Can issue Completion Badge
```

This protects reputation quality.

Completion Badges should require strong issuer authority.

---

# Membership Authority

AdminCap currently controls:

```text
Adventurer → Pro
Pro → Elite
```

Related module:

```move
module nami::membership
```

This is temporary MVP authority.

Future membership logic should use:

```text
Subscription proof
Expiration
Renewal
Grace periods
Membership records
```

---

# Moderation Authority

AdminCap currently exposes moderation actions.

Related module:

```move
module nami::moderation
```

Current actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

Black Passport updates Conduct status and restricts effective access.

Related module:

```move
module nami::conduct
```

---

# Appeal Authority

AdminCap can resolve appeals.

Related module:

```move
module nami::appeals
```

Current appeal outcomes:

```text
Approved
Denied
Modified
```

Appeal resolution should remain auditable.

Private appeal evidence should stay off-chain.

---

# Jury Authority

AdminCap can open and close advisory jury cases.

Related module:

```move
module nami::jury
```

Current jury role:

```text
Advisory recommendation
```

Admin still performs final appeal resolution during MVP.

Future versions may increase jury influence after privacy, anti-abuse, and governance systems mature.

---

# Cosmetic Authority

AdminCap can grant CosmeticUnlock proofs.

Related module:

```move
module nami::cosmetics
```

Current cosmetic categories include:

```text
Profile Frame
Passport Theme
Chat Overlay
Avatar Style
Badge Display
Title Effect
```

Cosmetic unlocks are display customization only.

They do not grant reputation, membership, verification, moderation authority, or governance rights.

---

# Recovery Authority

AdminCap can resolve RecoveryRequest objects.

Related module:

```move
module nami::recovery
```

Current recovery outcomes:

```text
Approved
Denied
Modified
```

Current recovery resolution does not transfer ownership.

This is intentional until the recovery security model is mature.

Recovery evidence should stay off-chain or encrypted.

---

# Channel Authority

AdminCap can verify Channels.

Related module:

```move
module nami::channel
```

Channel verification may be used by frontend/backend systems for:

```text
Trust display
Discovery weighting
Developer/community credibility
Reduced impersonation risk
```

Channel verification does not grant moderation authority by itself.

---

# AdminAction Event

Admin actions emit:

```move
AdminAction
```

Purpose:

Creates an indexable audit trail for sensitive protocol actions.

Current event fields:

```text
admin_cap_id
action_type
target
```

Detailed event documentation is in:

```text
docs/events.md
```

---

# Security Boundary

AdminCap should not be treated casually.

AdminCap controls actions that affect:

```text
Membership upgrades
Badge issuer authority
Moderation records
Black Passport
Appeals
Jury cases
Cosmetic unlocks
Recovery requests
Channel verification
```

Production deployment should define:

```text
Who holds AdminCap
How AdminCap is secured
How actions are audited
How emergency rotation works
How future authority is decentralized
```

---

# Current Test Coverage

Current tests verify that AdminCap can:

```text
Approve badge issuers
Upgrade membership to Pro and Elite
Issue moderation actions
Issue mute records that block channel chat
Resolve appeals
Open jury cases
Close jury cases
Grant cosmetic unlocks
Resolve recovery requests
Verify channels
```

---

# Future Work

Admin authority should eventually evolve into more granular permission systems.

Planned improvements:

```text
Role-based admin permissions
Channel moderator authority
Guild moderator authority
Developer-owned channel authority
Multi-admin controls
AdminCap rotation
Emergency pause authority
Timelocks for high-risk actions
Audit dashboard
Governance migration path
```

---

# Design Rules

Sensitive actions must be authority-gated.

Ordinary users should not self-upgrade.

Ordinary users should not issue moderation records.

Ordinary users should not approve badge issuers.

Ordinary users should not verify channels.

Ordinary users should not grant cosmetics.

Ordinary users should not resolve recovery requests.

Admin actions should emit events.

AdminCap is acceptable for MVP, but not the final trust model.

---

# Related Docs

```text
docs/access-control.md
docs/moderation.md
docs/appeals.md
docs/jury.md
docs/badge-system.md
docs/membership.md
docs/customization.md
docs/recovery.md
docs/events.md
```

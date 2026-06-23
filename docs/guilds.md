# Nami Guilds

## Purpose

Guilds are larger persistent communities in Nami.

Guilds are different from Squads.

Squads are small trust and sponsorship groups.

Guilds are larger community structures for players, channels, games, creators, and future developer ecosystems.

Guilds answer:

```text
What larger community does this player belong to or lead?
```

---

## Current Status

Current module:

```move
module nami::guild
```

Current protocol status:

```text
36 tests passing
0 warnings
```

Guilds are currently integrated with:

```text
Passport
Membership
Conduct
Effective tier checks
```

---

# Current Guild Rules

Current Guild creation requirements:

```text
Adventurer, Pro, or Elite effective tier
No active Black Passport
```

NPC users cannot create Guilds.

Black Passport users cannot create or manage Guild membership while restricted, even if their raw tier is Adventurer, Pro, or Elite.

---

# Current Objects

## Guild

The `Guild` object represents the community.

Current fields include:

* Owner
* Owner Passport ID
* Name
* Description
* Public/private setting
* Max members
* Member count
* Created timestamp
* Updated timestamp

The Guild owner counts as the first member.

---

## GuildMember

The `GuildMember` object represents membership proof.

Current fields include:

* Guild ID
* Member address
* Role
* Joined timestamp

Current role model:

```text
Member
```

Future versions may add owner, admin, moderator, officer, developer, and event roles.

---

# Current Member Limits

Guild size currently scales by effective membership tier:

```text
Adventurer = 25 members
Pro        = 100 members
Elite      = 250 members
```

These are MVP limits and may be adjusted later.

---

# Guild Creation

Current flow:

```text
Passport + ConductStatus
→ effective tier check
→ Guild object created
```

Guild creation emits:

```text
GuildCreated
```

Event details belong in:

```text
docs/events.md
```

---

# Adding Members

Guild owners can add members.

Current flow:

```text
Guild owner
→ add member
→ GuildMember object transferred to member
```

Adding a member emits:

```text
GuildMemberAdded
```

This is owner-managed for MVP.

Future versions may support:

* Public join requests
* Invitations
* Approval queues
* Role-based invites
* Channel-specific member permissions

---

# Updating Guilds

Guild owners can update:

* Name
* Description
* Public/private setting

Updating a Guild emits:

```text
GuildUpdated
```

---

# Conduct Integration

Guild actions use conduct-aware effective tier checks.

If a user has active Black Passport status:

```text
Effective tier = NPC-equivalent
```

This blocks Guild creation and owner management actions.

Black Passport does not delete Guild history by default.

---

# Membership Integration

Guild access currently starts at Adventurer.

Current relationship:

```text
Adventurer = small Guild
Pro        = larger Guild
Elite      = largest Guild
```

Future membership expiration should pause or reduce Guild benefits without deleting historical Guild records.

---

# Guilds vs Squads

## Squads

Small trust groups.

Current Pro/Elite benefit.

Used for sponsorship and close-circle trust.

## Guilds

Larger community structures.

Current Adventurer+ benefit.

Used for community identity, membership, and future events/channels.

---

# Current Test Coverage

Current tests verify:

* Adventurer can create a Guild
* NPC cannot create a Guild
* Guild owner can add a member
* Guild member receives a GuildMember proof
* Guild member count increases
* Adventurer Guild limit is applied

---

# Frontend — Guild Invites (UI prototype)

Guild owners and rank holders with invite permission can send invites from **Member Profile → Invite to guild**. Invites persist in `localStorage` (`guild-invites-store.ts`) until backend sync ships.

Tier slot caps (owner tier sets guild capacity):

```text
Adventurer → 25 members
Pro        → 100 members
Elite      → 250 members
```

Target members must be verified before an invite can be sent. Invitable guilds are filtered by capacity and hierarchy permissions (`canGuildMember`, `guild-hierarchy-store.ts`).

Key files: `MemberProfileActions.tsx`, `guild-invites-store.ts`, `nami-affiliations.ts`.

---

# Future Work

Planned Guild improvements:

```text
Guild roles
Guild moderators
Guild join requests
Guild channels
Guild access policies
Guild badge issuer hooks
Guild events
Guild discovery signals
Guild reputation
Guild ownership transfer
Guild member removal
Guild display on Passport profiles
```

---

# Design Rules

Guilds are larger than Squads.

Guild creation should require trusted access.

Black Passport should restrict active Guild benefits.

Guild history should not be erased by temporary restriction.

Guild authority should eventually become role-based.

Private Guild moderation evidence should stay off-chain.

---

# Related Docs

```text
docs/squads.md
docs/access-control.md
docs/membership.md
docs/conduct-system.md
docs/events.md
docs/trust-system.md
```

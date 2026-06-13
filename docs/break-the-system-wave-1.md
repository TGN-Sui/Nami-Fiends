# Break-the-System Suite — Wave 1

## Purpose

Wave 1 verifies that the most important restriction and recovery safety paths cannot be bypassed.

This wave focused on:

```text
Recovery object-linking abuse
Malformed recovery requests
Black Passport benefit bypass attempts
```

---

## Current Status

```text
Wave 1 status: Complete
Move tests: 65 passing
Warnings: 0
```

---

## Wave 1 Scope

Wave 1 tested whether restricted or malformed flows could bypass core safety rules.

Covered systems:

```text
Recovery
Conduct
Black Passport
Channels
Guilds
Profiles
Titles
Cosmetics
Squads
```

---

## Completed Tests

### 1. Recovery rejects unlinked Identity + Passport pair

Attack attempt:

```text
User owns a valid Identity.
User creates a Passport linked to a different Identity ID.
User tries to open recovery using the mismatched pair.
```

Expected result:

```text
Abort: invalid_recovery_request = 160
```

Result:

```text
Passed
```

---

### 2. Recovery rejects zero-address requested owner

Attack attempt:

```text
User owns a valid linked Identity + Passport.
User attempts to open recovery with requested_new_owner = 0x0.
```

Expected result:

```text
Abort: invalid_recovery_request = 160
```

Result:

```text
Passed
```

---

### 3. Black Passport cannot create Channels

Attack attempt:

```text
User verifies to Adventurer.
User receives a valid ConductStatus.
ConductStatus is downed to Black Passport.
User attempts to create a Channel anyway.
```

Expected result:

```text
Abort: insufficient_tier = 31
```

Result:

```text
Passed
```

---

### 4. Black Passport cannot create Guilds

Attack attempt:

```text
User verifies to Adventurer.
User receives a valid ConductStatus.
ConductStatus is downed to Black Passport.
User attempts to create a Guild anyway.
```

Expected result:

```text
Abort: insufficient_tier = 31
```

Result:

```text
Passed
```

---

### 5. Black Passport cannot create Profiles

Attack attempt:

```text
User owns a valid Passport.
User receives a valid ConductStatus.
ConductStatus is downed to Black Passport.
User attempts to create a Profile anyway.
```

Expected result:

```text
Abort: conduct_restricted = 101
```

Result:

```text
Passed
```

---

### 6. Black Passport cannot create TitleDisplay

Attack attempt:

```text
User owns a valid Passport.
User receives a valid ConductStatus.
ConductStatus is downed to Black Passport.
User attempts to create a TitleDisplay anyway.
```

Expected result:

```text
Abort: conduct_restricted = 101
```

Result:

```text
Passed
```

---

### 7. Black Passport cannot create CosmeticLoadout

Attack attempt:

```text
User owns a valid Passport.
User receives a valid ConductStatus.
ConductStatus is downed to Black Passport.
User attempts to create a CosmeticLoadout anyway.
```

Expected result:

```text
Abort: conduct_restricted = 101
```

Result:

```text
Passed
```

---

### 8. Black Passport cannot create Squads

Attack attempt:

```text
User is upgraded to Pro.
User receives a valid ConductStatus.
ConductStatus is downed to Black Passport.
User attempts to create a Squad anyway.
```

Expected result:

```text
Abort: insufficient_tier = 31
```

Result:

```text
Passed
```

---

### 9. Black Passport cannot sponsor Squad members

Attack attempt:

```text
User is upgraded to Pro.
User creates a Squad while in good standing.
ConductStatus is later downed to Black Passport.
User attempts to sponsor a Squad member anyway.
```

Expected result:

```text
Abort: insufficient_tier = 31
```

Result:

```text
Passed
```

---

### 10. Black Passport cannot add Guild members

Attack attempt:

```text
User verifies to Adventurer.
User creates a Guild while in good standing.
ConductStatus is later downed to Black Passport.
User attempts to add a Guild member anyway.
```

Expected result:

```text
Abort: insufficient_tier = 31
```

Result:

```text
Passed
```

---

## Wave 1 Result

Wave 1 confirms:

```text
Recovery rejects invalid Identity / Passport pairings.
Recovery rejects zero-address requested owners.
Black Passport blocks major active benefits.
Black Passport blocks community creation.
Black Passport blocks community management.
Black Passport blocks profile/customization object creation.
```

---

## Important Finding

The Black Passport model is consistently enforcing active benefit restrictions across:

```text
Channel creation
Guild creation
Profile creation
TitleDisplay creation
CosmeticLoadout creation
Squad creation
Squad sponsorship
Guild member management
```

This supports the intended rule:

```text
Black Passport pauses active benefits without erasing earned history.
```

---

## Next Wave

Wave 2 should focus on object pairing and ownership abuse.

Recommended targets:

```text
Profile cannot be updated with wrong Passport / Conduct pairing
TitleDisplay cannot equip mismatched EarnedTitle
CosmeticLoadout cannot equip mismatched CosmeticUnlock
ChannelAccessPolicy cannot be updated with wrong Channel
Guild member actions reject wrong owner
Squad sponsor actions reject wrong owner
Appeal cannot be opened for another user's moderation record
Recovery cannot be resolved twice
```

---

## Checkpoint

Wave 1 is complete.

Nami is ready to continue into:

```text
Break-the-System Suite — Wave 2
```

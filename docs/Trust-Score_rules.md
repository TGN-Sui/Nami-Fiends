# Nami Gems – Trust Score Calculation Rules

## Overview
The **Trust Score (0-100)** determines:
- Approval speed (higher = faster/less manual review).
- Maximum Gem stages allowed initially (Stage 1 only vs full 3-stage).
- Priority support, featured placement, and future benefits.
- Ability to issue more Gems or advanced conditions.

Score is **calculated automatically** during onboarding, updated with new proofs, and can be manually adjusted by curators (+/- points with audit log).

**Core Formula**:
**Trust Score = Base Legitimacy (40%) + Game Proof & Scope (30%) + Community & History (20%) + Self-Reflection & Technical (10%)**

Capped at 100. Minimum for approval: ~35 (Basic tier). Full Stage 3 access recommended at 65+.

## Detailed Weighting & Scoring Rules

### 1. Identity & Legitimacy (Max 40 points)
- Registered business / legal entity proof: +12
- Team public profiles (X, LinkedIn, etc.) with activity: +8
- Previous published titles (1-2: +6, 3+: +12)
- Studio website + consistent branding across links: +5
- Founding year + team size consistency: +3
- Notable experience/awards: +5-8
- **Penalties**: Anonymous team, mismatched info: -10 to -20

### 2. Game Proof & Publication (Max 30 points)
- Valid store pages (Steam/itch/Epic verified): +10-15 (higher for multiple)
- Public trailer + gameplay video: +5
- Press coverage / awards: +5
- Playable demo / public builds: +5
- Release status (Released/Live: +5, Early Access: +3, Pre-alpha: +1)
- **Scope Consistency**: Declared times match typical genre expectations (auto-check via templates): +3-5
- **Penalties**: Vaporware signals, broken links: -10+

### 3. Community & External Validation (Max 20 points)
- Community size (Discord/X/Steam): <500: +2 | 500-5k: +6 | 5k+: +12
- Wishlist / review count / player metrics: +3-6
- Influencer partnerships or positive coverage: +4
- No major controversy flags: +2
- **Bonus**: Strong modding community or active beta feedback: +3

### 4. Technical, Integration & Self-Reflection (Max 10 points)
- Strong anti-cheat / player identity measures (esp. new char prevention): +4
- Clear integration plan (Sui wallet linking): +3
- Thoughtful anti-farming answers (Section 14): +2-3
- **Penalties**: Evasive answers or high farming risk admission without mitigations: -5

## Tier Thresholds & Capabilities
- **0-40 (Basic Tier)**: Stage 1 only. Limited Gems. Manual review required. Slower approval.
- **41-70 (Verified Tier)**: Up to Stage 2. Faster review. Good for most indies.
- **71-100 (Premium Tier)**: Full 3-stage access. Auto-approval possible for high-scorers. Featured in Nami hub, priority support, analytics access.

**Boosters (extra points)**:
- Verified X/Steam/Epic account links (OAuth-style proof): +5-10 each
- Upload of official documents (business reg, tax ID snippet, publisher contract): +8-12
- Existing Sui ecosystem participation: +5
- High player metrics or sales data proof: +5-10

**Dynamic Updates**:
- Post-launch: Real player engagement data, fairness ratings from gamers, or successful integrations → +points over time.
- Abuse detection (high farming reports) → temporary or permanent deduction + review.

## Implementation Notes
- **Scoring Engine**: Simple rule-based (if/then + point tables) in backend. Later ML for smarter scope consistency checks.
- **Transparency**: Studios see breakdown in portal ("+12 for business proof") + suggestions to boost ("Link your verified Steam page for +8").
- **Curator Override**: Logged adjustments for edge cases (e.g., very new but promising studio with strong prototype).
- **Auditability**: All score history stored and linked to on-chain authority object.

This system is fair, transparent, and directly supports the anti-farming goals by rewarding legitimate, thoughtful studios with more autonomy.

---

Next up: Example condition mappings (priority 2). Let me know if you'd like any tweaks to the UI flow or Trust Score first!

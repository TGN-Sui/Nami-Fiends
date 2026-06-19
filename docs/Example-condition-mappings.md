# Nami Gems – Example Condition Mappings (Good vs Risky)

These examples demonstrate how the system uses questionnaire data (game duration, replayability, Trust Score) to guide/validate Stage 1/2/3 conditions. 

**Key Principle**: Stage 3 must feel meaningfully earned relative to the game's scope. The reasonableness score (powered by duration + replay + achievement depth) flags weak proposals.

## 1. Very Short Narrative Game (~20-40 minutes, Low Replayability, Trust Score 55 – Verified Tier)

**Good / Approved Setup**:
- **Stage 1**: Reach the first major story beat / complete tutorial + first chapter (accessible to 80%+ players).
- **Stage 2**: Finish the main story / see the primary ending.
- **Stage 3**: Complete all 3 endings + one "perfect" run (no deaths / all dialogue choices explored). *Requires replay.*

**Risky / Flagged** (would require revision or limit to Stage 1-2):
- Stage 3: "Beat the final boss" (too similar to Stage 2 for short game).

**Reasonableness Guidance**: Short + Low replay → enforce mastery or multiple completions for Stage 3.

## 2. Short Roguelite (~45-90 minutes per run, Very High Replayability, Trust Score 75 – Premium)

**Good Setup**:
- **Stage 1**: Complete 3 successful runs / reach depth 10.
- **Stage 2**: Unlock 50% of achievements or defeat mid-boss archetype.
- **Stage 3**: Reach true ending on 3 different builds + top 10% speedrun time or no-hit run.

**Risky**:
- Stage 3: "Complete one full run" (trivial due to high replay but low per-run effort).

**System Suggestion**: Leverage replayability heavily – "Build variety + mastery metrics".

## 3. Medium Indie RPG (6-12 hours main story, Medium-High Replay, Trust Score 45 – Basic/Verified)

**Good**:
- **Stage 1**: Reach Level 10 or complete first major area.
- **Stage 2**: Finish main campaign.
- **Stage 3**: All side quests + hardest difficulty clear + one NG+ chapter.

**Risky**:
- Stage 3: "Finish the campaign" (overlaps too much with Stage 2).

## 4. Long Epic / Open World (30+ hours, High Replay via exploration, Trust Score 85)

**Good**:
- **Stage 1**: Complete prologue + first hub.
- **Stage 2**: Main story arc 1 or 50% map exploration.
- **Stage 3**: 100% completion (all collectibles, endings, max level) + one full NG+.

**Risky**: Pure story-only Stage 3 for such a deep game (under-utilizes scope).

## 5. Live Service / Multiplayer Game (Ongoing, Variable Session Length)

**Good**:
- **Stage 1**: Play first 3 hours / complete onboarding.
- **Stage 2**: Reach Season 1 end or specific rank.
- **Stage 3**: Participate in 5+ seasons/events + high leaderboard placement or all seasonal achievements.

**Anti-Farming**: Account-bound + seasonal resets; prevent alt accounts via wallet linking.

## General Patterns for Strong Conditions
- **Stage 1**: Early, accessible milestone (10-25% effort).
- **Stage 2**: Substantial investment (50-70% effort or key progression gate).
- **Stage 3**: "Above and beyond" – often combines completion + mastery + replay/extras. Estimated effort 1.5-3x main story for short games.
- **Hybrid**: Mix time-based, achievement-based, and skill-based.
- **Public Description Example**: "Earned by players who mastered all endings and completed a flawless run."

**How the Portal Helps**:
- After scope questionnaire, auto-suggests templates.
- Live score: "This Stage 3 proposal scores 92/100 – excellent match for your 2hr narrative game with branching paths."
- Flags: "Warning: Condition seems achievable in <30% of main story time."

These mappings, combined with Trust Score gating and live scoring in the Studio Portal, create a robust defense against farming while empowering creative studios.

---

All three priorities (4 → 3 → 2) are now complete with dedicated docs. The badge system + questionnaire foundation is significantly strengthened.

**What's next?** Refinements to any of these, JSON schema for forms, Move contract outlines, visual gem concepts, or something else in the badge system? Let me know!
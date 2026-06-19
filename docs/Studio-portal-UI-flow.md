# Nami Gems – Studio Portal UI Flow & Onboarding Experience

## Overall Philosophy
- **Progressive Disclosure**: Start simple, unlock deeper questions and features as trust builds.
- **Live Feedback**: Real-time Trust Score, Reasonableness Score for conditions, and smart suggestions.
- **Guided Wizard Style**: Multi-step onboarding with clear progress bar, save/resume, and "why this matters" tooltips.
- **Mobile-Friendly + Dark Theme**: Optimized for game devs (desktop primary, responsive).
- **Visual & Contextual Help**: Inline examples, game-length templates, preview of what players will see.
- **Post-Approval Access**: Full dashboard for managing Gems, analytics, condition edits (under review), and integration testing.

## High-Level Onboarding Flow (Multi-Step Wizard)

### Step 0: Pre-Onboarding (Landing / Signup)
- "Join as Game Studio" button on main Nami Gems site / SuiPlay hub.
- Email + basic info (studio name, game title) → creates pending Studio Profile.
- Redirect to Wizard.

### Step 1: Identity & Basic Info (Legitimacy)
- Sections 1 + parts of 3 from QUESTIONNAIRE-EXPANDED.md
- Fields: Studio name, contact, website, previous titles, team profiles.
- Uploads: Business docs, team photos (optional).
- Live Trust Score preview (starts low, updates as you add proofs).
- "Save & Continue" – can return later.

**UI Elements**:
- Progress bar (1/5)
- Sidebar with "Trust Boosters" checklist (linking X/Steam, etc.)
- Example: "Verified studios get full 3-stage access faster"

### Step 2: Game Proof & Publication Status
- Sections 2 + 11 + 12
- Store links, trailers, press, community metrics.
- Auto-validation: Steam/itch.io link checker (basic scrape for existence).
- Upload proof documents (PDFs of store pages, contracts if needed).

**Live Features**:
- Trust Score rising in real-time.
- "Your game looks legitimate – great!" celebratory micro-copy.

### Step 3: Game Scope & Depth (Core Balancing Data)
- Sections 4, 5, 6, 7 (Duration, Replayability, Achievements – heavily weighted)
- Key inputs: Main story time, 100% time, replayability rating.
- Conditional questions shown based on answers (e.g., NG+ details if applicable).
- **Live Reasonableness Preview**: As you fill duration + replay, shows sample "fair Stage 3 conditions" for your game length.

**UI**:
- Sliders / number inputs with category selectors.
- Visual timeline or progress bar representing game length.
- Tooltip: "Games under 1hr typically need mastery/replay for Stage 3"

### Step 4: Technical & Integration Readiness
- Section 10
- Player account linking, anti-cheat, preferred integration method.
- Sui wallet / API readiness self-assessment.

### Step 5: Gem Vision & Initial Condition Planning
- Section 13 + parts of 14
- Describe high-level vision for Gems.
- Draft initial Stage 1/2/3 conditions (text + achievement mappings).
- **Live Scoring**: Reasonableness score (0-100) with color-coded feedback + suggested improvements.
  - Green: Looks earned!
  - Yellow: Consider adding mastery element.
  - Red: Too easy for declared scope – revise or curator review needed.

### Step 6: Review & Submit
- Summary dashboard of all answers.
- Final self-reflection questions (Section 14).
- Submit for review → estimated review time based on Trust Score.
- Option to "Request Priority Review" with extra proofs.

## Post-Approval Studio Dashboard

Once approved (email + in-app notification):

### Main Dashboard
- Overview: Trust Score, Active Gems, Total Players Earned, Analytics widgets.
- Quick actions: "Define New Gem", "Edit Conditions", "Test Mint", "View Public Page".

### Badge/Gem Management Wizard (Post-Approval Questionnaire)
This is the **carefully curated** second questionnaire for mapping achievements → stages.

**Flow**:
1. **Select or Create Gem Template**
   - Choose from library or upload custom base art.
   - One Gem per major category (e.g., "Main Campaign", "Mastery", "Exploration") or single comprehensive Gem.

2. **Achievement / Condition Mapper**
   - List all in-game achievements/milestones (import from Steam or manual entry).
   - For each relevant milestone:
     - Drag & drop or multi-select to assign to Stage 1, 2, or 3.
     - Or define custom conditions (hours played, specific combos, etc.).
   - System auto-suggests based on prior scope data.
   - Progressive: Start with Stage 1 (easy), then unlock 2/3 based on Trust Score.

3. **Condition Editor (Rich Form)**
   - Fields for each stage:
     - Internal trigger description (for your backend).
     - Player-facing description (public).
     - Estimated effort / % of players expected to reach.
     - Required proofs (e.g., screenshot, replay data).
   - Live preview of what the Gem will look like at each stage.
   - Validation: Cross-check against game duration/replayability → flags if Stage 3 seems trivial.

4. **Anti-Farming Safeguards Setup**
   - Options: Account-bound (prevent new char farming), cooldowns, one-per-player.
   - Self-declared enforcement commitments.

5. **Review & Publish**
   - Preview public player view.
   - Submit conditions for final curator sign-off (light for high-trust studios).
   - Once live: Test button to simulate mint/upgrade for a test wallet.

**UI Elements Throughout**:
- **Live Trust / Reasonableness Scores**: Persistent header badge.
- **Templates Library**: Pre-filled examples filtered by game length/genre (e.g., "Roguelite Short Game").
- **Side Preview Pane**: Real-time Gem visual + player-facing text.
- **Help / Examples Modal**: "See how a similar 2-hour narrative game set up their Stage 3".
- **Analytics Tab**: Projected engagement, farming risk estimates.
- **Version History**: Track changes to conditions.

## Technical Implementation Notes
- Built with React/Next.js (or Svelte if preferred for Sui ecosystem), Tailwind, Shadcn components.
- Form state with React Hook Form + Zod validation.
- Backend: Supabase or custom Sui-indexer linked DB for profiles.
- Real-time updates via WebSockets or polling.
- Accessibility: ARIA labels, keyboard nav.
- Dark mode with Nami/Sui brand colors (blues, purples, glowing gem accents).

## Success Metrics for the Flow
- High completion rate for core questions.
- Positive studio feedback on guidance ("this helped me make fair conditions").
- Low % of submissions flagged for heavy farming risk.
- Fast time-to-first-Gem after approval.

This UI flow turns the questionnaire from a chore into a helpful, educational experience that reinforces fairness while empowering studios.

---

**Ready for next priorities**: Trust Score rules (3) and example mappings (2). Let me know when to proceed or if you want refinements here (wireframe descriptions, specific screen mocks via text, component breakdown, etc.).

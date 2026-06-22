# Nami Gems – Comprehensive Questionnaire Question Bank (Expanded for Balance)

**Purpose of this expanded bank**  
This is a large, categorized collection of potential questions for the game studio onboarding questionnaire. Not every studio will answer every question (use progressive disclosure, conditional logic, and "core vs optional" tagging in the actual form).

**Shipped wizard (subset):** The live Enter Nami game path implements identity, official social proof, genres, store URLs, ticket submit, and a short badge questionnaire. See [game-onboarding.md](./game-onboarding.md), [Studio-portal-UI-flow.md](./Studio-portal-UI-flow.md), and [Trust-Score_rules.md](./Trust-Score_rules.md) for the live Trust Score inputs.

**Not in the live wizard:** Most sections below (studio legitimacy depth, achievement counts, Stage 1/2/3 condition bank) are design reference for Officials review and future Gems balance — they are not form fields in the shipped UI yet.

Questions below remain the long-term design bank for Gems balance and curator review.

The goal is to **balance the badge/Gem system** by:
- Strongly verifying that real, published games with substance are participating.
- Quantifying game scope, depth, time investment, and replayability so we can **automatically suggest fair Stage 1/2/3 conditions** and **score how "earned" a proposed Stage 3 condition feels**.
- Creating transparency and accountability (public conditions + data that powers analytics and farming detection).
- Gathering signals for tier assignment (Basic / Verified / Premium access to Stage 3).
- Supporting future features (analytics, leaderboards, SuiPlay/GameOS integration, reputation scoring).

**Core Mandatory Section for MVP** (must answer to submit): Sections 1, 2 (time estimates), 4 (basic achievement counts), and the Stage Conditions definitions.

**How answers help balance**:
- Short declared times + weak Stage 3 proposals → auto-flag + require justification or tier limit.
- High replayability + strong mastery conditions → easier approval for full 3-stage Gems.
- Legitimacy signals (store pages, previous titles, community size) → faster/higher tier.
- Data feeds reasonableness scoring engine (e.g., "Stage 3 effort should be ≥ 80-120% of main story time for most games").

---

## Section 1: Studio / Publisher Identity & Legitimacy Verification
These questions establish trust and block fly-by-night or asset-flip submissions.

1. *Studio / Publisher Legal Name (as registered)
2. *Primary Contact Full Name + Role
3. *Business Email (must match domain of official website if possible)
4. *Studio Website (or Linktree / Carrd if very early)
5. *Team Size (exact number or ranges: 1 | 2-5 | 6-15 | 16-50 | 50+)
6. *Founding Year of the studio
7. Do you have a registered business entity? (Yes / No / In process) → If yes, upload business registration snippet or link (optional but boosts trust)
8. Have you published any games before? (Yes / No) → If yes, list titles + store links + approximate total players or reviews if known
9. *Key team members public profiles (X/Twitter, LinkedIn, itch.io, personal sites – comma separated or list)
10. Any notable previous experience in game dev (AAA studios, successful Kickstarter, awards, etc.)? (open text)
11. Are you working with a publisher? (Yes/No + name if yes)
12. Do you have any legal or IP concerns with the game content? (Yes/No + brief explanation if yes)
13. Preferred communication channel for review feedback (Email / Discord / X DM / Other)

**Balancing value**: Establishes real humans behind the game. Previous titles + public team profiles are strong signals against anonymous farming operations.

---

## Section 2: Game Publication Status & Proof of Existence
Prevents vaporware or non-existent games from getting Gems.

14. *Current Development / Release Status: In Development (pre-alpha/alpha) | Closed Beta | Open Beta | Released / Live | Early Access | Live Service (ongoing updates)
15. *First public announcement date or earliest trailer/public build date
16. *Store / Distribution Pages (multi-select + URLs):
    - Steam
    - itch.io
    - Epic Games Store
    - GOG
    - Google Play / App Store
    - Microsoft Store
    - Other (specify)
17. *Official Game Website or Landing Page URL
18. *Trailer / Gameplay Video URLs (YouTube, Vimeo, etc. – at least one required)
19. Do you have a playable demo or vertical slice publicly available? (Yes/No + link)
20. *Number of public builds or major updates released so far (if applicable)
21. Any press coverage, articles, or features? (links or names of outlets)
22. Any awards, nominations, or festival selections? (list)
23. Steam / Store page visibility settings (Public / Coming Soon / Wishlist only / Private)
24. Do you plan to release on SuiPlay 0X1 or target GameOS features? (Yes / Planning / No / Not sure yet)

**Balancing value**: Real store pages + public trailers = strong legitimacy filter. Early-stage games can still participate but may start at lower tier until more proof exists.

---

## Section 3: Core Game Identity & High-Level Description
25. *Full Game Title (with any subtitle)
26. *Short Pitch / Tagline (≤ 160 characters) – used in collections & discovery
27. *One-sentence core loop description
28. *Full public description (for the Gem/game page – 300-800 words recommended)
29. *Primary Genre(s) – multi-select from standard list + "Other"
30. *Secondary Genres / Tags (e.g., Metroidvania, Roguelite, Visual Novel, Deckbuilder, etc.)
31. *Target Player Age Rating / ESRB / PEGI equivalent (Everyone, Teen, Mature, etc.)
32. *Primary Platforms (PC, Mac, Linux, Mobile iOS/Android, Console – which?, Browser, SuiPlay handheld, VR, Other)
33. *Input Methods (Keyboard+Mouse, Controller, Touch, Motion, etc.)
34. *Art Style / Visual Direction (Pixel Art, 3D Realistic, Stylized, Hand-drawn, Low-poly, ASCII, etc.)
35. *Tone / Themes (Dark, Whimsical, Horror, Inspirational, Satirical, Educational, etc.)
36. Estimated total unique assets or scope (Small / Medium / Large / AAA-scale) – helps calibrate expectations
37. Any major inspirations or comparable games? (list 2-4 titles)

---

## Section 4: Scope, Duration & Time Investment (MOST IMPORTANT FOR BALANCE)
This section is the foundation of anti-farming logic. Answers directly influence condition suggestions and Stage 3 scoring.

38. *Estimated Main Story / First Playthrough Completion Time (hours, decimal OK – e.g. 0.3 for ~18 min, 2.5, 12, 45)
39. *Or select closest category if exact number unknown:
    - Micro / Very Short (< 20 minutes)
    - Short (20-60 minutes)
    - Short-Medium (1-3 hours)
    - Medium (3-8 hours)
    - Medium-Long (8-20 hours)
    - Long (20-50 hours)
    - Epic / Very Long (50+ hours)
40. *Estimated 100% Completion / All Content / True Ending / Platinum Time (hours)
41. *Average / Typical Play Session Length (minutes): <10 | 10-20 | 20-40 | 40-60 | 60-90 | 90+
42. *How many distinct "major acts", chapters, worlds, or big story beats in the main campaign?
43. Rough total number of levels / stages / missions / maps (if applicable)
44. Estimated total playtime for a completionist player who does everything once (hours)
45. Do you have variable difficulty settings that significantly change playtime? (Yes/No + how much)
46. Is there a New Game+ or post-game mode that adds substantial new content? (Yes/No + estimated extra hours)
47. How many distinct endings or major branching paths exist? (1 / 2-3 / 4-6 / 7+ / Procedurally generated)
48. Estimated % of players who typically finish the main story (your expectation or data if available)
49. What percentage of total content is missable on a blind first playthrough? (Low <20%, Medium 20-50%, High >50%)
50. Do you track or plan to track average playtime via Steam achievements / your own analytics? (Yes/No)

**Balancing value**: These numbers are the primary input to the reasonableness scoring algorithm. A game declaring 25 min main story that proposes Stage 3 after "beat the final boss once" will be heavily flagged. Games with high branching or NG+ get more leeway for mastery-based Stage 3 conditions.

---

## Section 5: Gameplay Depth & Structure
51. *Rough total number of main story quests / objectives / missions
52. *Rough total number of optional / side quests or activities
53. *Rough total number of collectibles, secrets, or hidden items
54. Number of distinct character classes, builds, or playstyles (if applicable)
55. Number of weapons / abilities / spells / tools the player can unlock or master
56. Is there a skill tree, upgrade system, or permanent progression? (Yes/No + depth: Shallow / Medium / Deep)
57. How complex is the core combat / gameplay loop? (Simple / Medium / High skill ceiling / Very technical)
58. Are there multiple viable playstyles or "builds" that meaningfully change how you experience the game? (Yes/No)
59. Does the game have puzzles, exploration, or non-combat challenges that take significant time? (Yes/No + rough % of playtime)
60. Is there permadeath, roguelike elements, or high risk/reward? (Yes/No + details)
61. How much of the game is hand-crafted vs procedural / generated? (% estimate)

---

## Section 6: Achievements, Progression Systems & Milestones
This directly informs how easy it is to map real game progress to Gem stages.

62. *Total number of achievements / trophies / challenges you plan to implement (or currently have)
63. *How many achievements are tied to story progression / mandatory content?
64. How many are optional / missable / high-skill / completionist?
65. Do you have Steam Achievements, in-game achievement system, or both?
66. Typical % of players who unlock 25% / 50% / 75% / 100% of achievements (if you have data or strong expectations)
67. Are there "hidden" or secret achievements that most players miss on first play?
68. Do you have daily/weekly challenges, battle passes, or seasonal content that adds ongoing progression?
69. Is there a level / XP / prestige system for the player character? (Yes/No + max level or prestige count)
70. How many major "power spikes" or significant upgrades does a player get in a normal playthrough?
71. Are there multiple save files / characters / profiles per player account? (Yes/No) – important for "new character" farming prevention

**Balancing value**: High number of meaningful achievements makes it easier to create graduated Stage 1/2/3 conditions. Games with very few achievements may need more creative or time-based conditions.

---

## Section 7: Replayability, Mastery & Post-Game Content (Critical for Short Games)
72. *Replayability rating (self-assessment): Low (one-and-done) | Medium | High | Very High (designed for dozens/hundreds of hours)
73. *Primary drivers of replayability (multi-select):
    - Multiple endings / branching narratives
    - Roguelite / roguelike runs
    - New Game+ with new content or higher difficulty
    - Procedural generation / randomization
    - Multiplayer / PvP / co-op modes
    - Speedrunning / challenge modes / leaderboards
    - Collectibles / completionism
    - Build crafting / theorycrafting
    - Seasonal / live service content
    - Mod support / user-generated content
    - Other (specify)
74. Estimated hours a dedicated player can spend before "running out" of meaningful new content
75. Do you have or plan speedrun categories, community challenges, or official leaderboards?
76. Are there "mastery" or "grandmaster" level challenges that only top players complete? (Yes/No + examples)
77. How many full playthroughs would a completionist / 100% player typically do? (1 / 2 / 3 / 4+)
78. Is there significant post-game or endgame content? (Yes/No + hours estimate)
79. Do you expect most players to replay the game multiple times? (Yes/No + why)

**Balancing value**: Short games with **High/Very High** replayability can justify meaningful Stage 3 conditions (e.g., "complete all endings + a no-hit run"). Pure one-and-done short games will be guided toward mastery or multiple-completion requirements for Stage 3.

---

## Section 8: Multiplayer, Live Service & Social Elements
80. Is the game primarily single-player, multiplayer, or hybrid?
81. If multiplayer: Competitive / Cooperative / Both / Social hub only
82. Do you have ranked / competitive modes with skill-based matchmaking or leaderboards?
83. Estimated average hours per week a dedicated player spends in live service / seasonal content
84. How frequently do you plan major content updates or seasons? (Weekly / Bi-weekly / Monthly / Quarterly / Irregular / None planned)
85. Do you have or plan cross-play, cross-progression, or account linking?
86. Any social features that encourage long-term engagement (guilds, friends lists, trading, events)?
87. For live service games: How do you prevent "whales" or high-skill players from dominating early leaderboards / achievements?

**Balancing value**: Live service games have different farming risks (daily login abuse, alt accounts). Questions help tailor conditions (e.g., "participate in 3 seasonal events" instead of pure story progress).

---

## Section 9: Player Metrics & Historical Data (Optional but Valuable)
88. Current or expected total unique players / owners (ranges: <1k | 1k-10k | 10k-100k | 100k-1M | 1M+)
89. Current or expected average playtime per player (hours)
90. Current or expected % of players who finish the main story
91. Current or expected review count and average rating (Steam or other)
92. Wishlist count or pre-release interest metrics (if applicable)
93. Any public analytics dashboard or transparency reports you already publish?
94. Do you use any third-party analytics (Steamworks, GameAnalytics, etc.) that could share aggregated playtime data later?

**Balancing value**: Real data (even estimates) helps validate declared times and set realistic expectations. High player volume with low completion % might indicate overly long/grindy content → adjust suggestions.

---

## Section 10: Technical Architecture & Integration Readiness
95. *Do you already have persistent player accounts / profiles / cloud saves? (Yes/No)
96. *How do you currently identify or authenticate players? (Steam ID, custom accounts, guest, etc.)
97. *Do you have (or can you add) the ability to link a Sui wallet address to a player profile? (Yes / Can add / Difficult / No plans)
98. Preferred method for triggering Gem mint/upgrade from your game:
    - Your backend server calls Nami Gems API or submits signed Sui tx
    - Client-side (with player wallet signature)
    - Hybrid
    - Other / Not sure yet
99. Do you use or plan to use any on-chain elements already (NFTs, tokens, leaderboards on Sui or elsewhere)?
100. Estimated technical effort to integrate Gem issuance (Low / Medium / High – we can provide support)
101. Any anti-cheat or progress verification systems already in place? (Yes/No + brief description)
102. Can your system reliably detect and prevent the same player from creating many new characters just to farm Gems? (Yes/No + how)
103. Preferred programming languages / engines (Unity, Unreal, Godot, custom, web, etc.)

**Balancing value**: Technical readiness affects how reliably conditions can be enforced server-side. Games without good player identity / anti-alt measures may need stricter off-chain rules or lower initial tier.

---

## Section 11: Business Model, Monetization & Longevity
104. *Primary Monetization: One-time purchase (premium) | Free-to-Play (with IAP / battle pass) | Free with donations / tips | Subscription | Hybrid | Other
105. If F2P or has IAP: Do you have or plan "pay to progress faster" mechanics that could affect achievement fairness? (Yes/No + details)
106. Do you plan ongoing support and updates for at least 12-24 months post-launch? (Yes/No + commitment level)
107. Any plans for DLC, expansions, or sequels that would extend the game's "lifetime" significantly?
108. How important is long-term player retention vs one-time sales for your business?

**Balancing value**: Games designed for long-term engagement are better candidates for generous Stage 3 access. Short F2P games with heavy monetization may need extra scrutiny on condition fairness.

---

## Section 12: Community, Marketing & External Validation
109. *Primary community platforms and approximate sizes (Discord members, subreddit, X followers, Steam group, etc.)
110. Any active modding community or user-generated content?
111. Have you run or plan beta tests / playtests with external players? (Yes/No + size)
112. Any influencer, streamer, or content creator partnerships already secured?
113. Do you have a public roadmap or Trello/Notion page players can see?
114. Any controversy, review-bombing history, or past issues we should be aware of? (Yes/No + context – transparency builds trust)
115. How do you currently handle player feedback and community management?

**Balancing value**: Strong, engaged communities are a positive signal. They also provide natural accountability (players will complain publicly if Stage 3 conditions feel unfair).

---

## Section 13: Gem / Badge Vision & Condition Planning (Expanded)
116. Which Gem design themes interest you most from our library? (or describe desired aesthetic)
117. Do you want to use one Gem for the whole game, or multiple Gems for different categories (story, combat, exploration, mastery, etc.)?
118. For **Stage 1** – what is the earliest meaningful milestone almost every engaged player should hit?
119. For **Stage 2** – what represents a solid mid-game or "I've invested real time" achievement?
120. For **Stage 3** – describe your ideal "this player really went above and beyond" moment or set of accomplishments.
121. Would you prefer conditions to be:
    - Purely story / progression based
    - Time / hours played based
    - Achievement / challenge based
    - Hybrid / flexible
    - Mastery / skill based (speedruns, no-hit, etc.)
122. Any specific achievements, levels, or moments you already know you want to tie to each stage?
123. How strict do you want the conditions to feel? (Accessible to most players | For dedicated players | Only for hardcore / completionists)
124. Do you want the Gem stages to be upgradeable in one object, or separate mints for each stage?
125. Any special visual or flavor ideas for the three stages (e.g., "Stage 3 becomes covered in your game's unique particles")?

**Balancing value**: This section lets studios express their vision while we guide them toward balanced, non-trivial Stage 3 definitions using the scope data from earlier sections.

---

## Section 14: Self-Assessment & Anti-Farming Reflection
These questions encourage honest self-reflection and surface potential issues early.

126. On a scale of 1-10, how "grindy" or time-intensive do you consider your game for a typical player?
127. What is the single hardest or most time-consuming thing a player can do in your game?
128. If a player wanted to "farm" as many Gems as possible with minimal effort, what would they try to do? (be honest – helps us design safeguards)
129. How do you plan to prevent the same person from creating many new characters/saves just to earn multiple Gems from your game?
130. Do you believe your proposed Stage 3 condition would feel fair and earned to an average player who has already finished the main story once? (Yes/No + why)
131. Are there any parts of your game where progress can be trivially repeated or exploited? (Yes/No + details)
132. Would you be comfortable if your Gem conditions were made fully public and players could rate their fairness? (Yes/No + concerns)
133. Any concerns or ideas about how the Nami Gems system could be abused in your specific game?

**Balancing value**: Self-reported risks + comfort with transparency are excellent signals. Studios that thoughtfully answer these tend to propose better conditions.

---

## Section 15: Future Ecosystem Integration & Ambition
134. How interested are you in deeper integration with SuiPlay 0X1 / GameOS (native achievement display, hardware features, profile widgets, etc.)? (High / Medium / Low / Not interested yet)
135. Would you be open to cross-game events or "Gem synergy" rewards in the future (e.g., earning Gems in multiple games unlocks ecosystem bonuses)?
136. Any interest in on-chain leaderboards, verifiable playtime attestations, or other advanced Sui features later?
137. How important is the Nami Gems / Sui gaming ecosystem to your long-term plans for this title or studio? (Critical / Nice to have / Experimental)
138. Any other ideas, concerns, or features you would like to see in the Nami Gems system?

---

## Usage Notes for Implementation
- **Core path (MVP)**: Sections 1, 2 (time), 4 (achievements), 13 (condition definitions), plus basic legitimacy checks.
- **Progressive disclosure**: Show advanced sections (9, 14, etc.) only after core is complete, or as "boost your approval speed / tier" optional paths.
- **Smart defaults & live scoring**: As soon as Section 4 (time) + Section 7 (replayability) are filled, the form can show live "Projected Stage 3 reasonableness score" and suggested condition templates.
- **Validation rules examples**:
  - If main story < 1 hour AND replayability = Low AND Stage 3 condition does not mention multiple playthroughs/mastery → Block or require curator override.
  - If previous titles = 0 AND no store page + very short time → Suggest starting at Basic tier (Stage 1 only).
- **Data export**: All answers should be stored and linked to the on-chain `GameBadgeAuthority` for auditability.

This expanded bank gives us extremely strong tooling to keep the Gem system fair, valuable, and respected across short narrative experiences, medium indies, and long epic titles alike.

---

**Next actions I can take right now**:
- Turn this into a structured JSON schema or TypeScript types for the actual form.
- Create example "good vs bad" Stage 3 condition pairs for different game lengths.
- Build the reasonableness scoring rules engine (simple rule-based version first).
- Design the Studio Portal UI flow / wireframes for this questionnaire.
- Update the original QUESTIONNAIRE.md to reference or incorporate the best of this expanded version.

Which direction would you like to go next with the questionnaire and badge system balancing? Or shall I refine any specific section?
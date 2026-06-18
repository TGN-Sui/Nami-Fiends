export type LandingScenario = {
  id: string;
  title: string;
  pain: string;
  namiWay: string;
  outcome: string;
};

export type LandingPillar = {
  id: string;
  index: string;
  tag: string;
  title: string;
  detail: string;
  variant?: 'featured';
};

export const LANDING_HERO = {
  eyebrow: 'Portable gamer identity',
  headline: 'One Identity. Every Game.',
  subhead:
    'Nami is where your reputation, squads, guilds, events, chats, and achievements stay with you ' +
    'instead of resetting every time a new Chat App, launcher, or season drops.',
  trustNote:
    'Your passport proves you\'re the same gamer everywhere. What top guilds and leaderboards need before they trust a name.',
};

export const LANDING_SCENARIOS: LandingScenario[] = [
  {
    id: 'squad',
    title: '"Add me on the new game"',
    pain:
      'Launch week the squad chat is on fire. Everyone says they\'ll add you when they get the new game. ' +
      'Then someone switches console, someone renames for the new season, and friend requests sit pending ' +
      'while the group chat turns into "anyone on?" Your best teammate didn\'t ghost you — you lost the thread ' +
      'that tied your tags together.',
    namiWay:
      'Squads live on your Nami passport, not one gamertag or one chat app. When a member changes platform ' +
      'or name, the roster still knows who they are — same squad, new game, no rebuild from zero.',
    outcome: 'Keep the squad, not the scavenger hunt.',
  },
  {
    id: 'genre-lounge',
    title: '"Anyone still play FPS?"',
    pain:
      'When the meta moves, the lobby empties and the gamer group goes dead. General chat is too loud. ' +
      'You want people who play your way, no matter what title they are on tonight.',
    namiWay:
      'Official Nami genre lounges across all 23 IGDB genre rooms give fans a public home that outlives any single launch.',
    outcome: 'Your people live in the genre room, not the launch week server.',
  },
  {
    id: 'spam-bots',
    title: '"FREE GOLD — CLICK HERE"',
    pain:
      'A great gamer group chat runs clean for a week. Then blank accounts roll in with the same scams, ' +
      'the same links, the same noise. Real members go quiet. You stop opening the tab.',
    namiWay:
      'Bots can\'t claim a passport, so bots can\'t sit wit us.',
    outcome: 'Good chat survives the bot wave.',
  },
  {
    id: 'toxicity',
    title: 'A new player walks into a loud, messy public chat',
    pain:
      'Global game chats reward noise. New players bounce before they find the room that matches how they actually play.',
    namiWay:
      'Genre lounges, conduct aware rooms, and mute/block controls you own, plus official channels for events that matter.',
    outcome: 'Discover communities sized to how you play, not how loud the lobby is.',
  },
  {
    id: 'achievement',
    title: 'Your achievements are scattered across platforms',
    pain:
      'Hundreds of hours on Steam, console trophies, and event badges, but no single profile that shows who you are as a gamer.',
    namiWay:
      'Passport level, badge book, titles, and platform links roll into one TCG style identity card other members can actually read.',
    outcome: 'Carry proof of play across communities without reintroducing yourself.',
  },
];

/** IGDB defines 23 official top-level video game genres; Nami mirrors that lounge set in Game Hub. */
export const LANDING_GENRE_LOUNGES = [
  'Shooter',
  'MOBA',
  'RPG',
  'Sport',
  'Racing',
  'Fighting',
  'Adventure',
  'Strategy',
  'RTS',
  'Indie',
  'Platform',
  'Simulator',
  'Puzzle',
  'Tactical',
  'TBS',
  'Hack & Slash',
  'Music',
  'Arcade',
  'Visual Novel',
  'Card & Board',
  'Point & Click',
  'Quiz & Trivia',
  'Pinball',
] as const;

export const LANDING_PILLARS: LandingPillar[] = [
  {
    id: 'passport',
    index: '01',
    tag: 'Identity',
    title: 'Passport & badges',
    detail:
      'Your TCG style gamer card with level, reputation, badges, and platform links in one profile ' +
      'other members can read at a glance.',
    variant: 'featured',
  },
  {
    id: 'channels',
    index: '02',
    tag: 'Home',
    title: 'Channels & studios',
    detail:
      'Every game or community gets a verified channel with chat, events, guilds, and modules. ' +
      'One permanent home, not a scatter of invite links.',
    variant: 'featured',
  },
  {
    id: 'genre-lounges',
    index: '03',
    tag: 'Lounges',
    title: 'Genre lounges',
    detail:
      'Official lounges across 23 IGDB genre rooms from Shooter and MOBA to Visual Novel and Pinball. ' +
      'Meet your people by play style, not just by launch week.',
  },
  {
    id: 'squads',
    index: '04',
    tag: 'Crew',
    title: 'Squads & guilds',
    detail:
      'Persistent squads and guilds that survive platform hops, renames, and seasonal roster churn. ' +
      'Your crew stays on the passport, not one gamertag.',
  },
  {
    id: 'safety',
    index: '05',
    tag: 'Trust',
    title: 'Safety & conduct',
    detail:
      'Passport gated rooms, conduct signals, reports, and moderation you control. Real members stay, ' +
      'bots and bad faith noise don\'t get a seat.',
  },
];

export const LANDING_STEPS = [
  {
    step: '1',
    title: 'Enter Nami',
    detail: 'Quick signup and a short conduct quiz. No wallet lecture on day one.',
  },
  {
    step: '2',
    title: 'Claim your passport',
    detail: 'Choose a nodename, link platforms from Settings, and build your badge book.',
  },
  {
    step: '3',
    title: 'Join the world',
    detail:
      'Enter Game Hub, follow channels, jump into official genre lounges, and show up to live events.',
  },
];

export const GAME_HUB_INTRO = {
  eyebrow: 'Discover game communities',
  headline: 'Find your next main game and the room that fits how you play.',
  subhead:
    'Partner channels, trending games, cover art browser, and genre lounges, all ranked by real activity, not paid trust.',
  previewNote: 'Preview catalog active while discovery cycles populate.',
};
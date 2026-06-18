export type LandingScenario = {
  id: string;
  title: string;
  pain: string;
  namiWay: string;
  outcome: string;
};

export type LandingPillar = {
  title: string;
  detail: string;
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
      'You are a genre fan, not a one-game tourist. When the meta moves or your main goes quiet, ' +
      'the lobby empties and the gamer group goes dead. General gaming chat is too loud and too broad. ' +
      'Your current game\'s lobby only cares about this patch. You want to talk builds, ranked, raids, ' +
      'and strats with people who play the same way you do, no matter what title they are on tonight.',
    namiWay:
      'Official Nami genre lounges — FPS, MMORPG, MOBA, Sports & Racing, Sandbox, Souls-Like, JRPG — ' +
      'give genre fans a public home that outlives any single launch. Talk meta, LFG, and culture with ' +
      'people who play your way, even when your current game changes.',
    outcome: 'Your people live in the genre room, not the launch-week server.',
  },
  {
    id: 'creator',
    title: 'A creator outgrew one Discord and one link in bio',
    pain:
      'A studio runs multiple games, each with its own chat, events calendar, and subscriber list, all disconnected.',
    namiWay:
      'Each game gets a Nami channel: verified studio profile, official events, genre chat, badges, and follower slots in one surface.',
    outcome: 'Fans know where home is for every title you ship.',
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

export const LANDING_GENRE_LOUNGES = [
  'FPS',
  'MMORPG',
  'MOBA',
  'Sports & Racing',
  'Sandbox',
  'Souls-Like',
  'JRPG',
] as const;

export const LANDING_PILLARS: LandingPillar[] = [
  {
    title: 'Passport & badges',
    detail: 'Level, reputation, and collectible proof that follows you channel to channel.',
  },
  {
    title: 'Channels & studios',
    detail: 'Every game or community gets a verified home with chat, events, guilds, and modules.',
  },
  {
    title: 'Genre global chats',
    detail:
      'Official genre lounges for FPS, RPG, MOBA, sports, sandbox, and more, where gamers meet ' +
      'across every channel before they follow a specific game.',
  },
  {
    title: 'Squads & guilds',
    detail: 'Persistent groups that survive game hops and seasonal roster churn.',
  },
  {
    title: 'Safety & conduct',
    detail: 'Color signals, reports, appeals, and moderation that protect playable rooms.',
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
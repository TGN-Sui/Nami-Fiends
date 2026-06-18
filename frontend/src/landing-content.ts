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
  headline: 'One passport. Every game. Every crew.',
  subhead:
    'Nami is where your reputation, squads, guilds, events, and channel homes stay with you, ' +
    'instead of resetting every time a new Discord, launcher, or season drops.',
  trustNote:
    'Paid tiers unlock slots and tools. Verification and trust come from proofs, conduct, and moderation, never from a subscription.',
};

export const LANDING_SCENARIOS: LandingScenario[] = [
  {
    id: 'squad',
    title: 'Your raid team keeps splitting across games',
    pain:
      'You found a great squad in one title, then the crew scatters into separate Discords when the next game launches.',
    namiWay:
      'Squads and guilds live on your Nami passport. Same roster, new channel. Jump from FIENDS to Walrus Raiders without rebuilding the group chat from scratch.',
    outcome: 'Keep the people, not just the server history.',
  },
  {
    id: 'tournament',
    title: 'Tournament hosts cannot tell who is actually trusted',
    pain:
      'An event organizer sees a fresh account with no history and has no idea if this player was banned last season or is on an alt.',
    namiWay:
      'Conduct signals, moderation records, and verification travel with the member profile, not just the wallet they connected today.',
    outcome: 'Competitive rooms start with context, not guesswork.',
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
  'FPS Arena',
  'RPG Quest Hall',
  'MOBA Strategy',
  'Sports & Racing',
  'Sandbox Builders',
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
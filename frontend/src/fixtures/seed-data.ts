import type {
  ChannelModule,
  ChatMessage,
  NamiChannel,
  NamiDeveloperProfile,
  NamiMember,
  UserProfile,
} from '../domain/types.js';
import {
  buildDeveloperFromSuiGame,
  buildNamiChannelFromSuiGame,
} from './sui-game-catalog.js';

function demoChannelCover(title: string, gradientStart: string, gradientMid: string, accent: string): string {
  const label = title.slice(0, 14).toUpperCase();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' +
    gradientStart +
    '"/>' +
    '<stop offset=".55" stop-color="' +
    gradientMid +
    '"/>' +
    '<stop offset="1" stop-color="#05070d"/>' +
    '</linearGradient></defs>' +
    '<rect width="900" height="1200" fill="url(#g)"/>' +
    '<circle cx="700" cy="230" r="180" fill="' +
    accent +
    '" opacity=".28"/>' +
    '<rect x="96" y="96" width="708" height="1008" rx="58" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="10"/>' +
    '<text x="92" y="610" font-family="Arial Black, Arial" font-size="108" fill="#ffffff">' +
    label +
    '</text>' +
    '<text x="104" y="700" font-family="Arial" font-size="42" fill="#ffffff" opacity=".72">NAMI DEMO MEDIA</text>' +
    '</svg>';

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const defaultModules: ChannelModule[] = [
  { label: 'Game Chat', description: 'Main live community chat.' },
  { label: 'Timeline', description: 'Official posts and community updates.' },
  { label: 'Guilds', description: 'Guilds created inside this channel.' },
  { label: 'Events', description: 'Upcoming events and tournaments.' },
  { label: 'Esports', description: 'Competitive channel space.' },
  { label: 'Party Chats', description: 'Find squads and party members.' },
  { label: 'Patch Notes', description: 'Official change logs and notes.' },
  { label: 'Support', description: 'Support links and help channels.' },
  { label: 'Badges', description: 'Channel badge progression.' },
  { label: 'Badge Gated', description: 'Badge-gated channel areas.' }
];

export const channels: NamiChannel[] = [
  buildNamiChannelFromSuiGame('fiends'),
  buildNamiChannelFromSuiGame('xociety'),
  buildNamiChannelFromSuiGame('pawtato'),
  buildNamiChannelFromSuiGame('panzerdogs'),
  {
    coverImageUrl: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20900%201200%22%3E%20%3Cdefs%3E%20%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%20%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2375d7ff%22%2F%3E%20%3Cstop%20offset%3D%22.55%22%20stop-color%3D%22%230c7f65%22%2F%3E%20%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2305070d%22%2F%3E%20%3C%2FlinearGradient%3E%20%3C%2Fdefs%3E%20%3Crect%20width%3D%22900%22%20height%3D%221200%22%20fill%3D%22url(%23g)%22%2F%3E%20%3Ccircle%20cx%3D%22700%22%20cy%3D%22230%22%20r%3D%22180%22%20fill%3D%22%2343f5a7%22%20opacity%3D%22.28%22%2F%3E%20%3Cpath%20d%3D%22M80%20900%20C250%20720%20420%201020%20820%20780%20L820%201200%20L80%201200%20Z%22%20fill%3D%22%2343f5a7%22%20opacity%3D%22.28%22%2F%3E%20%3Crect%20x%3D%2296%22%20y%3D%2296%22%20width%3D%22708%22%20height%3D%221008%22%20rx%3D%2258%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%2210%22%2F%3E%20%3Ctext%20x%3D%2292%22%20y%3D%22610%22%20font-family%3D%22Arial%20Black%2C%20Arial%22%20font-size%3D%22126%22%20fill%3D%22%23ffffff%22%3EPEBBLE%3C%2Ftext%3E%20%3Ctext%20x%3D%22104%22%20y%3D%22700%22%20font-family%3D%22Arial%22%20font-size%3D%2242%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.72%22%3ENAMI%20DEMO%20MEDIA%3C%2Ftext%3E%20%3C%2Fsvg%3E',
    id: 'pebble',
      surfaceType: 'game',
    name: 'Pebble',
    handle: '@pebble',
    owner: 'Pebble Labs',
      developerId: 'pebble-labs',
      developerName: 'Pebble Labs',
      developerLogoSeed: 'PL',
      coverArtSeed: 'builder-wave',
      coverArtStyle: 'builder',
      verifiedGame: true,
    genre: 'Builder / Creative',
    platforms: ['Sui', 'Web'],
    subscribers: 23771,
    verified: true,
    partner: true,
    officialNami: true,
    signal: 'Green',
    tagline: 'Builder community with verified creative channels.',
    banner: 'Builder wave banner',
    theme: 'teal',
    modules: defaultModules,
    officialBadges: ['Verified Channel', 'Partner Channel', 'Builder Hub'],
    customBadges: ['Creator', 'Module Maker', 'Early Builder'],
    verifiedLinks: [
      { label: 'Official Website', verified: true },
      { label: 'Builder Docs', verified: true },
      { label: 'Social Updates', verified: true }
    ],
    announcements: [
      'Builder showcase submissions are open.',
      'Partner spotlight starts next week.',
      'Creative guilds can now request featured placement.'
    ]
  },
  {
    id: 'vortex',
    surfaceType: 'game',
    name: 'Vortex Strike',
    handle: '@vortex',
    owner: 'Pulse Vector',
    developerId: 'pulse-vector',
    developerName: 'Pulse Vector',
    developerLogoSeed: 'PV',
    coverArtSeed: 'tactical-grid',
    coverArtStyle: 'neon',
    coverImageUrl: demoChannelCover('Vortex Strike', '#ff3152', '#221020', '#75d7ff'),
    verifiedGame: true,
    genre: 'FPS / Shooter',
    platforms: ['PC', 'Console'],
    subscribers: 4210,
    verified: true,
    partner: true,
    signal: 'Green',
    tagline: 'Ranked shooters, highlight reels, and nightly scrims.',
    banner: 'Tactical neon banner',
    theme: 'crimson',
    modules: defaultModules,
    officialBadges: ['Verified Channel', 'Esports Ready'],
    customBadges: ['Ace Pilot', 'Clutch Crew', 'Ranked Regular'],
    verifiedLinks: [{ label: 'Official Website', verified: true }],
    announcements: ['Ranked season reset is live.', 'Creator scrim queue opens Friday.']
  },
  {
    id: 'emberquest',
    surfaceType: 'game',
    name: 'Ember Quest',
    handle: '@emberquest',
    owner: 'Loreforge Studio',
    developerId: 'loreforge-studio',
    developerName: 'Loreforge Studio',
    developerLogoSeed: 'LF',
    coverArtSeed: 'ember-quest',
    coverArtStyle: 'ocean',
    coverImageUrl: demoChannelCover('Ember Quest', '#ffb347', '#4a1d12', '#ffe66d'),
    verifiedGame: true,
    genre: 'RPG / Adventure',
    platforms: ['PC', 'Console', 'Mobile'],
    subscribers: 3188,
    verified: true,
    partner: false,
    signal: 'Green',
    tagline: 'Story chapters, co-op dungeons, and lore watch parties.',
    banner: 'Ember quest banner',
    theme: 'amber',
    modules: defaultModules,
    officialBadges: ['Verified Channel', 'Story Hub'],
    customBadges: ['Lore Keeper', 'Dungeon Lead', 'Quest Cartographer'],
    verifiedLinks: [{ label: 'Official Website', verified: true }],
    announcements: ['Chapter 4 watch party starts tonight.', 'Co-op dungeon finder refreshed.']
  },
  {
    id: 'titangrid',
    surfaceType: 'game',
    name: 'Titan Grid',
    handle: '@titangrid',
    owner: 'Grid Theory',
    developerId: 'grid-theory',
    developerName: 'Grid Theory',
    developerLogoSeed: 'GT',
    coverArtSeed: 'strategy-lattice',
    coverArtStyle: 'arcade',
    coverImageUrl: demoChannelCover('Titan Grid', '#9b5de5', '#241238', '#75d7ff'),
    verifiedGame: false,
    genre: 'MOBA / Strategy',
    platforms: ['PC'],
    subscribers: 2875,
    verified: false,
    partner: false,
    signal: 'Orange',
    tagline: 'Draft rooms, macro clinics, and ranked ladder chatter.',
    banner: 'Strategy lattice banner',
    theme: 'violet',
    modules: defaultModules,
    officialBadges: ['Strategy Hub'],
    customBadges: ['Shotcaller', 'Macro Mind', 'Lane Captain'],
    verifiedLinks: [{ label: 'Meta Board', verified: false }],
    announcements: ['Patch review stream tomorrow.', 'Amateur league signups are open.']
  },
  {
    id: 'driftcircuit',
    surfaceType: 'game',
    name: 'Drift Circuit',
    handle: '@driftcircuit',
    owner: 'Velocity House',
    developerId: 'velocity-house',
    developerName: 'Velocity House',
    developerLogoSeed: 'VH',
    coverArtSeed: 'speed-line',
    coverArtStyle: 'arcade',
    coverImageUrl: demoChannelCover('Drift Circuit', '#43f5a7', '#0c4f43', '#dff7ff'),
    verifiedGame: false,
    genre: 'Sports / Racing',
    platforms: ['PC', 'Console'],
    subscribers: 1944,
    verified: false,
    partner: false,
    signal: 'Green',
    tagline: 'Time trials, custom tracks, and weekend grand prix.',
    banner: 'Speed line banner',
    theme: 'mint',
    modules: defaultModules,
    officialBadges: ['Racing League'],
    customBadges: ['Ghost Driver', 'Track Builder', 'Pit Crew'],
    verifiedLinks: [{ label: 'League Standings', verified: false }],
    announcements: ['Weekly time trial board reset.', 'Community track spotlight voting is live.']
  },
  {
    id: 'hollowsignal',
    surfaceType: 'game',
    name: 'Hollow Signal',
    handle: '@hollowsignal',
    owner: 'Night Lantern',
    developerId: 'night-lantern',
    developerName: 'Night Lantern',
    developerLogoSeed: 'NL',
    coverArtSeed: 'fog-forest',
    coverArtStyle: 'neon',
    coverImageUrl: demoChannelCover('Hollow Signal', '#6d28d9', '#12091f', '#ff4d6d'),
    verifiedGame: true,
    genre: 'Horror / Survival',
    platforms: ['PC', 'Console'],
    subscribers: 1560,
    verified: true,
    partner: false,
    signal: 'Red',
    tagline: 'Survival runs, horror events, and signal-safe rooms.',
    banner: 'Fog forest banner',
    theme: 'violet',
    modules: defaultModules,
    officialBadges: ['Verified Channel', 'Night Event'],
    customBadges: ['Last Light', 'Signal Scout', 'Safe Room Host'],
    verifiedLinks: [{ label: 'Event Calendar', verified: true }],
    announcements: ['Night raid event opens at midnight.', 'Signal-safe lounge rules updated.']
  },
  {
    id: 'pixelorchard',
    surfaceType: 'game',
    name: 'Pixel Orchard',
    handle: '@pixelorchard',
    owner: 'Indie Orchard',
    developerId: 'indie-orchard',
    developerName: 'Indie Orchard',
    developerLogoSeed: 'IO',
    coverArtSeed: 'soft-garden',
    coverArtStyle: 'cozy',
    coverImageUrl: demoChannelCover('Pixel Orchard', '#86efac', '#1a3d2d', '#fef08a'),
    verifiedGame: false,
    genre: 'Indie / Experimental',
    platforms: ['PC', 'Mobile', 'Web'],
    subscribers: 980,
    verified: false,
    partner: false,
    signal: 'Green',
    tagline: 'Experimental jams, demo nights, and cozy creator feedback.',
    banner: 'Soft garden banner',
    theme: 'green',
    modules: defaultModules,
    officialBadges: ['Indie Spotlight'],
    customBadges: ['Demo Night', 'Jam Host', 'Playtest Friend'],
    verifiedLinks: [{ label: 'Demo Board', verified: false }],
    announcements: ['Friday demo night submissions open.', 'Creator feedback circles expanded.']
  },
  {
    id: 'forgelands',
    surfaceType: 'game',
    name: 'Forge Lands',
    handle: '@forgelands',
    owner: 'Anvil Works',
    developerId: 'anvil-works',
    developerName: 'Anvil Works',
    developerLogoSeed: 'AW',
    coverArtSeed: 'forge-valley',
    coverArtStyle: 'builder',
    coverImageUrl: demoChannelCover('Forge Lands', '#f59e0b', '#3b2208', '#75d7ff'),
    verifiedGame: true,
    genre: 'Sandbox / Builder',
    platforms: ['PC', 'Sui', 'Web'],
    subscribers: 5120,
    verified: true,
    partner: true,
    signal: 'Green',
    tagline: 'Builder showcases, guild plots, and creator economy rooms.',
    banner: 'Forge valley banner',
    theme: 'amber',
    modules: defaultModules,
    officialBadges: ['Verified Channel', 'Builder Hub', 'Partner Channel'],
    customBadges: ['Plot Owner', 'Blueprint Smith', 'Guild Mason'],
    verifiedLinks: [{ label: 'Official Website', verified: true }],
    announcements: ['Guild plot lottery opens this week.', 'Builder economy patch notes posted.']
  },
  {
    id: 'novasocial',
    surfaceType: 'game',
    name: 'Nova Social',
    handle: '@novasocial',
    owner: 'Orbit Lounge',
    developerId: 'orbit-lounge',
    developerName: 'Orbit Lounge',
    developerLogoSeed: 'OL',
    coverArtSeed: 'orbit-lounge',
    coverArtStyle: 'neon',
    coverImageUrl: demoChannelCover('Nova Social', '#38bdf8', '#0f2a44', '#c4b5fd'),
    verifiedGame: false,
    genre: 'Gaming / Social',
    platforms: ['PC', 'Mobile', 'Streaming'],
    subscribers: 3644,
    verified: true,
    partner: false,
    officialNami: true,
    signal: 'Green',
    tagline: 'Party games, creator lounges, and cross-game meetups.',
    banner: 'Orbit lounge banner',
    theme: 'blue',
    modules: defaultModules,
    officialBadges: ['Verified Channel', 'Social Hub'],
    customBadges: ['Party Host', 'Lounge Mod', 'Meetup Regular'],
    verifiedLinks: [{ label: 'Official Website', verified: true }],
    announcements: ['Cross-game meetup calendar refreshed.', 'Creator lounge slots expanded.']
  }
];

export const developers: NamiDeveloperProfile[] = [
  buildDeveloperFromSuiGame('fiends'),
  buildDeveloperFromSuiGame('xociety'),
  buildDeveloperFromSuiGame('pawtato'),
  buildDeveloperFromSuiGame('panzerdogs'),
  {
    logoImageUrl: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%3E%20%3Cdefs%3E%20%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%20%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2375d7ff%22%2F%3E%20%3Cstop%20offset%3D%221%22%20stop-color%3D%22%230c7f65%22%2F%3E%20%3C%2FlinearGradient%3E%20%3C%2Fdefs%3E%20%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2296%22%20fill%3D%22url(%23g)%22%2F%3E%20%3Ccircle%20cx%3D%22310%22%20cy%3D%2288%22%20r%3D%2256%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.14%22%2F%3E%20%3Ctext%20x%3D%2270%22%20y%3D%22245%22%20font-family%3D%22Arial%20Black%2C%20Arial%22%20font-size%3D%22126%22%20fill%3D%22%23ffffff%22%3EPL%3C%2Ftext%3E%20%3C%2Fsvg%3E',
    id: 'pebble-labs',
    surfaceType: 'developer',
    name: 'Pebble Labs',
    handle: '@pebble-labs',
    logoSeed: 'PL',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['pebble'],
    studioSignal: 'Green'
  },
  {
    id: 'pulse-vector',
    surfaceType: 'developer',
    name: 'Pulse Vector',
    handle: '@pulse-vector-dev',
    logoSeed: 'PV',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['vortex'],
    studioSignal: 'Green'
  },
  {
    id: 'loreforge-studio',
    surfaceType: 'developer',
    name: 'Loreforge Studio',
    handle: '@loreforge-dev',
    logoSeed: 'LF',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['emberquest'],
    studioSignal: 'Green'
  },
  {
    id: 'grid-theory',
    surfaceType: 'developer',
    name: 'Grid Theory',
    handle: '@grid-theory-dev',
    logoSeed: 'GT',
    proofStatus: 'Community Maintainer',
    approved: false,
    gameIds: ['titangrid'],
    studioSignal: 'Orange'
  },
  {
    id: 'velocity-house',
    surfaceType: 'developer',
    name: 'Velocity House',
    handle: '@velocity-house-dev',
    logoSeed: 'VH',
    proofStatus: 'Community Maintainer',
    approved: false,
    gameIds: ['driftcircuit'],
    studioSignal: 'Green'
  },
  {
    id: 'night-lantern',
    surfaceType: 'developer',
    name: 'Night Lantern',
    handle: '@night-lantern-dev',
    logoSeed: 'NL',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['hollowsignal'],
    studioSignal: 'Red'
  },
  {
    id: 'indie-orchard',
    surfaceType: 'developer',
    name: 'Indie Orchard',
    handle: '@indie-orchard-dev',
    logoSeed: 'IO',
    proofStatus: 'Community Maintainer',
    approved: false,
    gameIds: ['pixelorchard'],
    studioSignal: 'Green'
  },
  {
    id: 'anvil-works',
    surfaceType: 'developer',
    name: 'Anvil Works',
    handle: '@anvil-works-dev',
    logoSeed: 'AW',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['forgelands'],
    studioSignal: 'Green'
  },
  {
    id: 'orbit-lounge',
    surfaceType: 'developer',
    name: 'Orbit Lounge',
    handle: '@orbit-lounge-dev',
    logoSeed: 'OL',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['novasocial'],
    studioSignal: 'Green'
  }
];

export const userProfile: UserProfile = {
  displayName: 'Robbos',
  handle: '@npcgamer',
  wallet: '0xUSER',
  passportId: '0xPASSPORT',
  tier: 'Elite',
  level: 18,
  xp: 1840,
  reputation: 'Gamester',
  conductSignal: 'Green',
  bio: 'Portable gamer identity powered by Sui. This is the user-owned profile area, separate from channel/game profiles.',
  favoritePlatforms: ['PC', 'Sui', 'Console'],
  ownedBadges: ['First Quest', 'Community Event', 'Verified Completion'],
  titles: ['Gamester', 'Goblin', 'Guild Ally'],
  cosmetics: ['Genesis Frame', 'Wave Passport Theme', 'Signal Ring']
};

export const members: NamiMember[] = [
  {
    avatarImageUrl: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%3E%20%3Cdefs%3E%20%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20x2%3D%221%22%20y1%3D%220%22%20y2%3D%221%22%3E%20%3Cstop%20offset%3D%220%22%20stop-color%3D%22%239fffd2%22%20stop-opacity%3D%22.26%22%2F%3E%20%3Cstop%20offset%3D%22.46%22%20stop-color%3D%22%23062a22%22%2F%3E%20%3Cstop%20offset%3D%221%22%20stop-color%3D%22%239fffd2%22%20stop-opacity%3D%22.18%22%2F%3E%20%3C%2FlinearGradient%3E%20%3C%2Fdefs%3E%20%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2272%22%20fill%3D%22%23062a22%22%2F%3E%20%3Cpath%20d%3D%22M0%20270%20C74%20218%20142%20322%20220%20270%20C292%20222%20330%20252%20400%20214%20L400%20400%20L0%20400%20Z%22%20fill%3D%22%239fffd2%22%20opacity%3D%22.18%22%2F%3E%20%3Cpath%20d%3D%22M-28%2074%20C56%2018%20132%20112%20220%2062%20C306%2012%20356%2044%20428%200%20L428%20148%20C334%20196%20284%20156%20216%20190%20C130%20232%2062%20148%20-28%20198%20Z%22%20fill%3D%22%239fffd2%22%20opacity%3D%22.13%22%2F%3E%20%3Ctext%20x%3D%22200%22%20y%3D%22228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%20Black%2C%20Arial%2C%20sans-serif%22%20font-size%3D%22118%22%20fill%3D%22%239fffd2%22%20letter-spacing%3D%22-10%22%3ERB%3C%2Ftext%3E%20%3C%2Fsvg%3E',
    id: 'm1',
    surfaceType: 'member',
    avatarSeed: 'RB',
    name: 'Robbos',
    signal: 'Green',
    tier: 'Pro',
    badge: 'Top Helper',
    isNamiTeam: true,
  },
  {
    id: 'm2',
    surfaceType: 'member',
    avatarSeed: 'DS',
    name: 'DeadlySin',
    signal: 'Orange',
    tier: 'Adventurer',
    badge: 'Raider',
  },
  { id: 'm3', surfaceType: 'member', avatarSeed: 'RH', name: 'Rhokdelar', signal: 'Red', tier: 'Elite', badge: 'PvP' },
  { id: 'm4', surfaceType: 'member', avatarSeed: 'PF', name: 'PebbleFan', signal: 'Green', tier: 'NPC', badge: 'Newbie' },
  { id: 'm5', surfaceType: 'member', avatarSeed: 'MG', name: 'MutedGhost', signal: 'Black', tier: 'Adventurer', badge: 'Respawn' },
  { id: 'm6', surfaceType: 'member', avatarSeed: 'KV', name: 'KiteVoyager', signal: 'Green', tier: 'Adventurer', badge: 'Explorer' },
  { id: 'm7', surfaceType: 'member', avatarSeed: 'LM', name: 'LumenMage', signal: 'Orange', tier: 'Pro', badge: 'Arcanist' },
  { id: 'm8', surfaceType: 'member', avatarSeed: 'SR', name: 'StormRelay', signal: 'Green', tier: 'Elite', badge: 'Captain' },
  { id: 'm9', surfaceType: 'member', avatarSeed: 'CB', name: 'CoralBloom', signal: 'Green', tier: 'Adventurer', badge: 'Support' },
  { id: 'm10', surfaceType: 'member', avatarSeed: 'NP', name: 'NexusPilot', signal: 'Green', tier: 'Pro', badge: 'Ace' },
  { id: 'm11', surfaceType: 'member', avatarSeed: 'VS', name: 'VantaShade', signal: 'Orange', tier: 'Adventurer', badge: 'Scout' },
  { id: 'm12', surfaceType: 'member', avatarSeed: 'EW', name: 'EchoWarden', signal: 'Green', tier: 'Elite', badge: 'Guardian' },
  { id: 'm13', surfaceType: 'member', avatarSeed: 'PN', name: 'PixelNomad', signal: 'Green', tier: 'Adventurer', badge: 'Indie' },
  { id: 'm14', surfaceType: 'member', avatarSeed: 'RH2', name: 'RuneHarbor', signal: 'Orange', tier: 'Pro', badge: 'Mage' },
  { id: 'm15', surfaceType: 'member', avatarSeed: 'TC', name: 'TideCaster', signal: 'Green', tier: 'Adventurer', badge: 'Healer' },
  { id: 'm16', surfaceType: 'member', avatarSeed: 'AC', name: 'AshCircuit', signal: 'Red', tier: 'Elite', badge: 'Striker' },
  { id: 'm17', surfaceType: 'member', avatarSeed: 'MS', name: 'MapleSprint', signal: 'Green', tier: 'Adventurer', badge: 'Racer' },
  { id: 'm18', surfaceType: 'member', avatarSeed: 'ZL', name: 'ZenithLoop', signal: 'Green', tier: 'Pro', badge: 'Strategist' },
  { id: 'm19', surfaceType: 'member', avatarSeed: 'HM', name: 'HarborMint', signal: 'Green', tier: 'Adventurer', badge: 'Builder' }
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'c1',
    time: '02:22',
    author: 'Robbos',
    signal: 'Green',
    body: 'Looking for members for tonight’s &Wave Raiders run. Ping @DeadlySin if you are in.'
  },
  {
    id: 'c2',
    time: '02:23',
    author: 'DeadlySin',
    signal: 'Orange',
    body: 'Party queue open in #FIENDS. Serious run but friendly lobby.'
  },
  {
    id: 'c3',
    time: '02:24',
    author: 'Rhokdelar',
    signal: 'Red',
    body: 'PvP room is live. High intensity only.'
  },
  {
    id: 'c4',
    time: '02:25',
    author: 'PebbleFan',
    signal: 'Green',
    body: 'NPC check-in. I am here for the cozy event board.'
  },
  {
    id: 'c5',
    time: '02:27',
    author: 'Robbos',
    signal: 'Green',
    body: 'Official event banner just dropped. Check announcements.'
  }
];
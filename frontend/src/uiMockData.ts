export type ConductSignal = 'Green' | 'Orange' | 'Red' | 'Black';

export type NamiPage =
  | 'hub'
  | 'gamehub'
  | 'subscriptions'
  | 'profile'
  | 'chat';

export type ChannelModule = {
  label: string;
  description: string;
};

export type NamiChannel = {
  id: string;
  name: string;
  handle: string;
  owner: string;
  genre: string;
  platforms: string[];
  subscribers: number;
  verified: boolean;
  partner: boolean;
  signal: ConductSignal;
  tagline: string;
  banner: string;
  theme: string;
  modules: ChannelModule[];
};

export type NamiMember = {
  id: string;
  name: string;
  signal: ConductSignal;
  tier: 'NPC' | 'Adventurer' | 'Pro' | 'Elite';
  badge: string;
};

export type ChatMessage = {
  id: string;
  time: string;
  author: string;
  signal: ConductSignal;
  body: string;
};

export const channels: NamiChannel[] = [
  {
    id: 'fiends',
    name: 'FIENDS',
    handle: '@fiends',
    owner: 'Goonie Labs',
    genre: 'Gaming / Social',
    platforms: ['PC', 'Sui', 'Streaming'],
    subscribers: 128,
    verified: true,
    partner: true,
    signal: 'Green',
    tagline: 'Discuss, vibe, and game out with the rest of the squad.',
    banner: 'Official cyber alley banner',
    theme: 'crimson',
    modules: [
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
    ]
  },
  {
    id: 'walrus',
    name: 'Walrus Raiders',
    handle: '@walrus',
    owner: 'Walrus Community',
    genre: 'Adventure',
    platforms: ['PC', 'Console'],
    subscribers: 1228,
    verified: true,
    partner: false,
    signal: 'Orange',
    tagline: 'Serious co-op crews, friendly strategy, and raids.',
    banner: 'Ocean raid banner',
    theme: 'blue',
    modules: []
  },
  {
    id: 'pawtato',
    name: 'Pawtato',
    handle: '@pawtato',
    owner: 'Pawtato Community',
    genre: 'Casual / Cozy',
    platforms: ['Mobile', 'PC'],
    subscribers: 2668,
    verified: false,
    partner: false,
    signal: 'Green',
    tagline: 'Casual community for cozy players and collectors.',
    banner: 'Cozy forest banner',
    theme: 'green',
    modules: []
  },
  {
    id: 'retro',
    name: 'Retro Arena',
    handle: '@retro',
    owner: 'Retro Arcade',
    genre: 'Arcade / PvP',
    platforms: ['PC', 'Console'],
    subscribers: 877,
    verified: false,
    partner: false,
    signal: 'Red',
    tagline: 'High-intensity retro PvP and arcade events.',
    banner: 'Neon arcade banner',
    theme: 'violet',
    modules: []
  },
  {
    id: 'pebble',
    name: 'Pebble',
    handle: '@pebble',
    owner: 'Pebble Labs',
    genre: 'Builder / Creative',
    platforms: ['Sui', 'Web'],
    subscribers: 23771,
    verified: true,
    partner: true,
    signal: 'Green',
    tagline: 'Builder community with verified creative channels.',
    banner: 'Builder wave banner',
    theme: 'teal',
    modules: []
  }
];

export const members: NamiMember[] = [
  { id: 'm1', name: 'Nozomi', signal: 'Green', tier: 'Pro', badge: 'Top Helper' },
  { id: 'm2', name: 'DeadlySin', signal: 'Orange', tier: 'Adventurer', badge: 'Raider' },
  { id: 'm3', name: 'Rhokdelar', signal: 'Red', tier: 'Elite', badge: 'PvP' },
  { id: 'm4', name: 'PebbleFan', signal: 'Green', tier: 'NPC', badge: 'Newbie' },
  { id: 'm5', name: 'MutedGhost', signal: 'Black', tier: 'Adventurer', badge: 'Respawn' }
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'c1',
    time: '02:22',
    author: 'Slowdown',
    signal: 'Green',
    body: 'Looking for members for tonight’s guild run.'
  },
  {
    id: 'c2',
    time: '02:23',
    author: 'DeadlySin',
    signal: 'Orange',
    body: 'Party queue open. Serious run but friendly lobby.'
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
    author: 'Nozomi',
    signal: 'Green',
    body: 'Official event banner just dropped. Check announcements.'
  }
];

export const navItems: Array<{
  page: NamiPage;
  label: string;
  shortLabel: string;
}> = [
  { page: 'hub', label: 'Nami Hub', shortLabel: 'Hub' },
  { page: 'subscriptions', label: 'My Subscriptions', shortLabel: 'Subs' },
  { page: 'profile', label: 'Game Profile', shortLabel: 'Profile' }
];

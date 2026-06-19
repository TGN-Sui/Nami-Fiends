import { shouldAutoSeedLocalData } from './app-config.js';
import { readChannelChatOverlay } from './messages-store.js';
import { channels, members, type ChatMessage, type NamiChannel, type NamiMember } from './uiMockData.js';

const CHANNEL_ROSTER_NAMES: Record<string, string[]> = {
  pebble: ['PebbleFan', 'HarborMint', 'PixelNomad', 'CoralBloom', 'Robbos'],
  forgelands: ['KiteVoyager', 'StormRelay', 'ZenithLoop', 'MapleSprint', 'AshCircuit'],
  fiends: ['DeadlySin', 'Rhokdelar', 'NexusPilot', 'EchoWarden', 'VantaShade'],
  walrus: ['LumenMage', 'TideCaster', 'StormRelay', 'RuneHarbor', 'KiteVoyager'],
  pawtato: ['CoralBloom', 'PixelNomad', 'HarborMint', 'TideCaster', 'ZenithLoop'],
  retro: ['RuneHarbor', 'MapleSprint', 'VantaShade', 'AshCircuit', 'NexusPilot'],
  vortex: ['NexusPilot', 'AshCircuit', 'ZenithLoop', 'StormRelay', 'DeadlySin'],
  emberquest: ['EchoWarden', 'LumenMage', 'RuneHarbor', 'CoralBloom', 'KiteVoyager'],
  titangrid: ['ZenithLoop', 'VantaShade', 'NexusPilot', 'MapleSprint', 'Rhokdelar'],
  driftcircuit: ['MapleSprint', 'HarborMint', 'KiteVoyager', 'PixelNomad', 'StormRelay'],
  hollowsignal: ['AshCircuit', 'VantaShade', 'Rhokdelar', 'EchoWarden', 'DeadlySin'],
  pixelorchard: ['PixelNomad', 'HarborMint', 'CoralBloom', 'TideCaster', 'ZenithLoop'],
};

const CHANNEL_MESSAGE_TEMPLATES: Record<string, string[]> = {
  pebble: [
    'Builder showcase lobby is open — share your module WIP.',
    'Creative guild requests are pinned in the Pebble event board.',
    'PebbleFan checking in for tonight’s cozy builder night.',
    'Module maker thread refreshed — tag your squad when you post.',
    'Partner spotlight queue opens after the showcase block.',
  ],
  forgelands: [
    'Forge valley siege practice starts in twenty minutes.',
    'Anvil guild recruiting two builders for the weekend run.',
    'Resource route map updated — check the pinned forge guide.',
    'KiteVoyager hosting a crafting clinic in voice.',
    'Weekend siege roster closes at midnight Forge Lands time.',
  ],
};

function channelById(channelId: string): NamiChannel | undefined {
  return channels.find((channel) => channel.id === channelId);
}

function hashOffset(channelId: string): number {
  return channelId.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function memberByName(name: string): NamiMember | undefined {
  return members.find((member) => member.name === name);
}

function rosterForChannel(channelId: string): NamiMember[] {
  const overrideNames = CHANNEL_ROSTER_NAMES[channelId];

  if (overrideNames) {
    return overrideNames
      .map((name) => memberByName(name))
      .filter((member): member is NamiMember => Boolean(member && member.signal !== 'Black'));
  }

  const eligible = members.filter((member) => member.signal !== 'Black');
  const offset = hashOffset(channelId);
  const stride = 2 + (offset % 4);
  const count = Math.min(8, Math.max(5, 4 + (offset % 5)));
  const picked = new Map<string, NamiMember>();

  for (let index = 0; picked.size < count && index < eligible.length * 2; index += 1) {
    const member = eligible[(offset + index * stride) % eligible.length]!;

    picked.set(member.id, member);
  }

  return [...picked.values()];
}

function defaultTemplates(channel: NamiChannel): string[] {
  return [
    'Welcome to ' + channel.name + ' main chat — channel rules are pinned.',
    'LFG in ' + channel.name + ' tonight? Drop your rank and role.',
    channel.genre + ' squad fill happening now.',
    'Event board updated for ' + channel.name + '.',
    'Voice lounge open for ' + channel.name + ' regulars.',
    'Patch watch thread — share notes for ' + channel.name + '.',
    'Moderator reminder: keep spoilers tagged in ' + channel.name + '.',
    'New member intro thread is live in ' + channel.name + '.',
  ];
}

function fixtureTemplates(channelId: string, channel: NamiChannel): string[] {
  return CHANNEL_MESSAGE_TEMPLATES[channelId] ?? defaultTemplates(channel);
}

function buildFixtureChannelMessages(channelId: string): ChatMessage[] {
  const channel = channelById(channelId);

  if (!channel) {
    return [];
  }

  const roster = rosterForChannel(channelId);
  const templates = fixtureTemplates(channelId, channel);

  if (roster.length === 0) {
    return [];
  }

  return templates.map((body, index) => {
    const author = roster[index % roster.length]!;

    return {
      id: channelId + '-seed-' + index,
      time:
        String(10 + Math.floor(index / 3)).padStart(2, '0') +
        ':' +
        String((index * 7) % 60).padStart(2, '0'),
      author: author.name,
      signal: author.signal,
      body,
    };
  });
}

export function getChannelChatMessages(channelId: string): ChatMessage[] {
  const overlay = readChannelChatOverlay(channelId);

  if (!shouldAutoSeedLocalData()) {
    return overlay;
  }

  return [...buildFixtureChannelMessages(channelId), ...overlay];
}

export function getChannelChatPresenceMembers(
  channelId: string,
  messages: readonly ChatMessage[] = getChannelChatMessages(channelId),
): NamiMember[] {
  const authorNames = new Set(messages.map((message) => message.author));
  const seen = new Set<string>();
  const presence: NamiMember[] = [];

  for (const member of members) {
    if (member.signal === 'Black' || !authorNames.has(member.name) || seen.has(member.id)) {
      continue;
    }

    seen.add(member.id);
    presence.push(member);
  }

  return presence;
}
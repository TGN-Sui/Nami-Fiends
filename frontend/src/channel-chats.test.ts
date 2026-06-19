import { describe, expect, it } from 'vitest';

import { getChannelChatMessages, getChannelChatPresenceMembers } from './channel-chats.js';

describe('channel chat isolation', () => {
  it('returns channel-specific fixture bodies for each game room', () => {
    const pebble = getChannelChatMessages('pebble');
    const forgelands = getChannelChatMessages('forgelands');

    expect(pebble.some((message) => message.body.includes('Pebble'))).toBe(true);
    expect(forgelands.some((message) => message.body.toLowerCase().includes('forge'))).toBe(true);
    expect(pebble[0]?.body).not.toBe(forgelands[0]?.body);
  });

  it('keeps pebble main chatters out of forge lands presence', () => {
    const pebblePresence = getChannelChatPresenceMembers('pebble');
    const forgePresence = getChannelChatPresenceMembers('forgelands');

    expect(pebblePresence.some((member) => member.name === 'PebbleFan')).toBe(true);
    expect(forgePresence.some((member) => member.name === 'PebbleFan')).toBe(false);
    expect(pebblePresence.some((member) => member.name === 'KiteVoyager')).toBe(false);
    expect(forgePresence.some((member) => member.name === 'KiteVoyager')).toBe(true);
  });
});
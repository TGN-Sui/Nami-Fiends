import { describe, expect, it } from 'vitest';

import { getGlobalChatMessages } from './global-chats.js';

describe('genre chat isolation', () => {
  it('returns genre-specific fixture bodies for each lounge', () => {
    const moba = getGlobalChatMessages('genre-moba');
    const racing = getGlobalChatMessages('genre-racing');

    expect(moba[0]?.body).toContain('MOBA');
    expect(racing[0]?.body).toContain('Racing');
    expect(moba[0]?.body).not.toBe(racing[0]?.body);
    expect(moba[4]?.body).not.toBe(racing[4]?.body);
  });

  it('keeps hub global chats separate from genre lounges', () => {
    const official = getGlobalChatMessages('official-nami-global');
    const moba = getGlobalChatMessages('genre-moba');

    expect(official[0]?.body).toContain('global lounge');
    expect(moba[0]?.body).toContain('MOBA lounge');
  });
});
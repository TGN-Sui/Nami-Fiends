import { describe, expect, it } from 'vitest';

import {
  defaultFavoriteRoomIds,
  favoriteRoomTabLabel,
  validateFavoriteSelection,
} from './chat-room-registry.js';
import { members } from './uiMockData.js';

describe('chat-room-registry', () => {
  it('builds default favorites with two genre lounges and own live chat', () => {
    expect(defaultFavoriteRoomIds('m1')).toEqual([
      'genre-shooter',
      'genre-moba',
      'member-public-live-m1',
    ]);
  });

  it('labels own room tab as My Chat', () => {
    const selfMember = members.find((member) => member.id === 'm1')!;

    expect(favoriteRoomTabLabel('member-public-live-m1', selfMember)).toBe('My Chat');
  });

  it('rejects more than two genre favorites', () => {
    expect(
      validateFavoriteSelection(
        ['genre-shooter', 'genre-moba', 'genre-racing', 'member-public-live-m1'],
        'm1'
      )
    ).toMatch(/two genre/);
  });

  it('requires own public live chat in favorites', () => {
    expect(validateFavoriteSelection(['genre-shooter', 'genre-moba'], 'm1')).toMatch(/public live chat/);
  });
});
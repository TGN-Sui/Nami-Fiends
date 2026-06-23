import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isAllowedChatRoomId,
  isMemberPublicChatRoomId,
  memberPublicChatHostMemberId,
  validateFavoriteRoomIds,
} from './chat-rooms.js';

describe('chat-rooms', () => {
  it('allows member public live chat rooms', () => {
    assert.equal(isMemberPublicChatRoomId('member-public-live-m1'), true);
    assert.equal(isAllowedChatRoomId('member-public-live-m1'), true);
    assert.equal(memberPublicChatHostMemberId('member-public-live-m1'), 'm1');
  });

  it('validates favorite room selection', () => {
    const roomIds = validateFavoriteRoomIds(
      ['genre-shooter', 'genre-moba', 'member-public-live-m1'],
      'm1'
    );

    assert.deepEqual(roomIds, ['genre-shooter', 'genre-moba', 'member-public-live-m1']);
  });

  it('rejects missing own room', () => {
    assert.throws(
      () => validateFavoriteRoomIds(['genre-shooter', 'genre-moba'], 'm1'),
      /chat_favorites_missing_own_room/
    );
  });
});
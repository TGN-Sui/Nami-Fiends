import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  listPendingChannelTransfersForRecipient,
  sanitizeTransferForRecipient,
  type ChannelOwnershipTransfer,
} from './channel-transfers.service.js';

describe('channel-transfers.service', () => {
  it('sanitizes transfer records for recipient responses', () => {
    const transfer: ChannelOwnershipTransfer = {
      id: 'transfer-1',
      channelId: 'owner-game-test',
      gameTitle: 'Starfall',
      channelHandle: 'starfall',
      fromOwner: '0xabc',
      targetKind: 'email',
      targetEmail: 'studio@example.com',
      status: 'pending',
      createdAtMs: Date.now(),
      expiresAtMs: Date.now() + 60_000,
    };

    const sanitized = sanitizeTransferForRecipient(transfer);

    assert.equal(sanitized.id, 'transfer-1');
    assert.equal('targetEmail' in sanitized, false);
  });

  it('matches pending transfers by normalized email only', async () => {
    const transfer: ChannelOwnershipTransfer = {
      id: 'transfer-email-1',
      channelId: 'owner-game-demo',
      gameTitle: 'Demo',
      channelHandle: 'demo',
      fromOwner: '0xfrom',
      targetKind: 'email',
      targetEmail: 'recipient@example.com',
      status: 'pending',
      createdAtMs: Date.now(),
      expiresAtMs: Date.now() + 86_400_000,
    };

    await (await import('../storage.js')).writeJsonFile('data/projections/channel-transfers.json', {
      transfers: [transfer],
      updatedAtMs: Date.now(),
    });

    const matches = await listPendingChannelTransfersForRecipient({
      owner: '0xrecipient',
      syncEmail: 'Recipient@Example.com',
    });

    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.id, 'transfer-email-1');
  });
});
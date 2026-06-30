import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

describe('global-chat-messages.service author guard', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NAMI_OFFICIAL_OWNER =
      '0x1111111111111111111111111111111111111111111111111111111111111111';
    process.env.NAMI_OFFICIAL_NODENAME = 'fiendtgnceo';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('blocks reserved FIEND author for non-official wallets', async () => {
    const { assertGlobalChatAuthorAllowed } = await import('./global-chat-messages.service.js');

    assert.throws(
      () =>
        assertGlobalChatAuthorAllowed(
          '0x2222222222222222222222222222222222222222222222222222222222222222',
          'FIEND',
        ),
      /global_chat_author_reserved/,
    );
  });

  it('allows reserved author for the official owner wallet', async () => {
    const { assertGlobalChatAuthorAllowed } = await import('./global-chat-messages.service.js');

    assert.doesNotThrow(() =>
      assertGlobalChatAuthorAllowed(
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        'FIEND',
      ),
    );
  });
});
import { describe, expect, it } from 'vitest';

import { chatOverlayRewardsSyncErrorMessage } from './chat-overlay-rewards-sync.js';

describe('chatOverlayRewardsSyncErrorMessage', () => {
  it('maps wallet auth errors to reconnect guidance', () => {
    expect(chatOverlayRewardsSyncErrorMessage('wallet_auth_unavailable')).toContain('Reconnect zkLogin');
  });

  it('maps invalid art values to re-upload guidance', () => {
    expect(chatOverlayRewardsSyncErrorMessage('invalid_art_value')).toContain('Re-upload');
  });
});
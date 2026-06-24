import { describe, expect, it } from 'vitest';

import { platformOwnerAssetsSyncErrorMessage } from './platform-owner-assets-sync.js';

describe('platformOwnerAssetsSyncErrorMessage', () => {
  it('explains when wallet auth is unavailable', () => {
    expect(platformOwnerAssetsSyncErrorMessage('wallet_auth_unavailable')).toContain('Reconnect zkLogin');
  });

  it('explains when local-only media blocks sync', () => {
    expect(platformOwnerAssetsSyncErrorMessage('channel_media_not_hydrated')).toContain('local-only media');
  });
});
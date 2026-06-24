import { readChannelOwnerProfileEdits } from './channel-owner-profile-store.js';
import type { NamiChannel } from './uiMockData.js';

export function syncOwnerProvisionedChannelProfileSnapshot(
  channel: NamiChannel,
  tagline?: string
): void {
  void import('./owner-provisioned-channels-store.js').then(
    ({ ownerProvisionedChannelById, updateOwnerProvisionedChannelSnapshot }) => {
      if (!ownerProvisionedChannelById(channel.id)) {
        return;
      }

      const profileEdits = readChannelOwnerProfileEdits(channel.id);
      const resolvedTagline = tagline ?? profileEdits?.tagline ?? channel.tagline;

      updateOwnerProvisionedChannelSnapshot(channel.id, {
        tagline: resolvedTagline,
        genres: profileEdits?.genres ?? [],
        platforms: profileEdits?.platforms ?? channel.platforms,
        updatedAtMs: Date.now(),
      });
    }
  );
}
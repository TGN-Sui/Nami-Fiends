import { saveChannelOwnerProfileEdits } from './channel-owner-profile-store.js';
import { normalizeGameGenres } from './game-genres.js';
import { normalizeSupportedPlatforms } from './platform-genre-options.js';
import type { OwnerProvisionedChannel } from './owner-provisioned-channels-store.js';

const APPLIED_SNAPSHOT_KEY_PREFIX = 'nami.owner.snapshot.applied.';

function readAppliedSnapshotMs(channelId: string): number {
  try {
    const stored = window.localStorage.getItem(APPLIED_SNAPSHOT_KEY_PREFIX + channelId);

    if (!stored) {
      return 0;
    }

    const parsed = Number(stored);

    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function markSnapshotApplied(channelId: string, updatedAtMs: number): void {
  window.localStorage.setItem(APPLIED_SNAPSHOT_KEY_PREFIX + channelId, String(updatedAtMs));
}

export function applyOwnerProvisionedSnapshots(channels: OwnerProvisionedChannel[]): void {
  for (const channel of channels) {
    const snapshot = channel.ownerSnapshot;

    if (!snapshot || typeof snapshot.updatedAtMs !== 'number') {
      continue;
    }

    if (readAppliedSnapshotMs(channel.channelId) >= snapshot.updatedAtMs) {
      continue;
    }

    if (snapshot.platforms || snapshot.genres || snapshot.tagline) {
      saveChannelOwnerProfileEdits(channel.channelId, {
        platforms: normalizeSupportedPlatforms(snapshot.platforms ?? channel.platforms),
        genres: normalizeGameGenres(
          snapshot.genres && snapshot.genres.length > 0 ? snapshot.genres : [channel.genre]
        ),
        ...(snapshot.tagline ? { tagline: snapshot.tagline } : {}),
      });
    }

    markSnapshotApplied(channel.channelId, snapshot.updatedAtMs);
  }
}
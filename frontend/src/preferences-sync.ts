import { fetchChannelPreferences, isChannelPreferencesApiAvailable } from './channel-preferences-api.js';
import {
  hydrateChannelCoverOverride,
  setChannelPreferencesSyncOwner,
} from './channel-cover-store.js';
import {
  fetchMemberPreferences,
  isMemberPreferencesApiAvailable,
  syncMemberPreferencesToBackend,
} from './member-preferences-api.js';
import {
  readSelfAvatarOverride,
  saveSelfAvatarOverride,
  setMemberPreferencesSyncOwner,
} from './member-avatar-store.js';
import {
  readSelfStreamingOnline,
  setMemberOnlinePreferencesSyncOwner,
  setSelfStreamingOnline,
} from './member-online-store.js';
import {
  fetchMembershipSubscription,
  isMembershipSubscriptionApiAvailable,
  subscriptionToPlanState,
  syncMembershipSubscriptionToBackend,
} from './membership-subscriptions-api.js';
import {
  hydrateMembershipPlanState,
  readMembershipPlanState,
  setMembershipSubscriptionSyncOwner,
} from './membership-plans-store.js';
import { fetchStudioPreferences, isStudioPreferencesApiAvailable } from './studio-preferences-api.js';
import { hydrateStudioLogoOverride, setStudioPreferencesSyncOwner } from './studio-logo-store.js';

export type PreferencesSurface = 'member' | 'channel' | 'studio';

export function isPreferencesApiAvailable(surface: PreferencesSurface): boolean {
  if (surface === 'member') {
    return isMemberPreferencesApiAvailable();
  }

  if (surface === 'channel') {
    return isChannelPreferencesApiAvailable();
  }

  return isStudioPreferencesApiAvailable();
}

export function preferencesStorageHint(surface: PreferencesSurface): string {
  if (!isPreferencesApiAvailable(surface)) {
    return 'Stored locally until the backend API is available.';
  }

  if (surface === 'member') {
    return 'Synced to the receiving server for this wallet.';
  }

  if (surface === 'channel') {
    return 'Synced to the receiving server for this channel owner wallet.';
  }

  return 'Synced to the receiving server for this studio owner wallet.';
}

export function setSessionPreferencesSyncOwner(owner: string | null): void {
  const normalizedOwner = owner?.startsWith('0x') ? owner : null;

  setMembershipSubscriptionSyncOwner(normalizedOwner);
  setMemberPreferencesSyncOwner(normalizedOwner);
  setMemberOnlinePreferencesSyncOwner(normalizedOwner);
  setChannelPreferencesSyncOwner(normalizedOwner);
  setStudioPreferencesSyncOwner(normalizedOwner);
}

export async function hydrateMembershipPreferences(owner: string): Promise<void> {
  if (!isMembershipSubscriptionApiAvailable()) {
    return;
  }

  try {
    const subscription = await fetchMembershipSubscription(owner);

    if (subscription) {
      hydrateMembershipPlanState(subscriptionToPlanState(subscription));
      return;
    }

    const local = readMembershipPlanState();
    await syncMembershipSubscriptionToBackend(local, owner);
  } catch {
    // Subscription sync is best-effort during demo wiring.
  }
}

export async function hydrateMemberPreferences(owner: string): Promise<void> {
  if (!isMemberPreferencesApiAvailable()) {
    return;
  }

  try {
    const preferences = await fetchMemberPreferences(owner);

    if (preferences) {
      if (preferences.avatarUrl) {
        saveSelfAvatarOverride(preferences.avatarUrl);
      }

      setSelfStreamingOnline(preferences.streamingOnline);
      return;
    }

    await syncMemberPreferencesToBackend({
      owner,
      avatarUrl: readSelfAvatarOverride(),
      streamingOnline: readSelfStreamingOnline(),
    });
  } catch {
    // Preference sync is best-effort during demo wiring.
  }
}

export async function hydrateMemberSessionPreferences(owner: string): Promise<void> {
  await hydrateMembershipPreferences(owner);
  await hydrateMemberPreferences(owner);
}

export async function hydrateChannelCoverPreference(channelId: string): Promise<void> {
  if (!isChannelPreferencesApiAvailable()) {
    return;
  }

  try {
    const preferences = await fetchChannelPreferences(channelId);

    if (preferences?.coverUrl) {
      hydrateChannelCoverOverride(channelId, preferences.coverUrl);
    }
  } catch {
    // Channel preference hydration is best-effort.
  }
}

export async function hydrateStudioLogoPreference(studioId: string): Promise<void> {
  if (!isStudioPreferencesApiAvailable()) {
    return;
  }

  try {
    const preferences = await fetchStudioPreferences(studioId);

    if (preferences?.logoUrl) {
      hydrateStudioLogoOverride(studioId, preferences.logoUrl);
    }
  } catch {
    // Studio preference hydration is best-effort.
  }
}
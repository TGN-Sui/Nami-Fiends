import { fetchActiveHubSuperBanners, type HubSuperBannerCampaign } from './hub-super-banner-api.js';
import {
  fetchMemberPreferences,
  isMemberPreferencesApiAvailable,
  syncMemberPreferencesToBackend,
  type MemberPreferences,
} from './member-preferences-api.js';

export type SuperBannerQueuePayload = {
  id: string;
  channelId: string;
  coverUrl: string;
  headline: string;
  body: string;
  sentAtMs: number;
};

export function campaignToQueuePayload(campaign: HubSuperBannerCampaign): SuperBannerQueuePayload {
  return {
    id: campaign.id,
    channelId: campaign.channelId,
    coverUrl: campaign.coverUrl,
    headline: campaign.headline,
    body: campaign.body,
    sentAtMs: campaign.sentAtMs,
  };
}

export function filterUnseenSuperBanners(
  campaigns: HubSuperBannerCampaign[],
  seenIds: string[],
): HubSuperBannerCampaign[] {
  const seen = new Set(seenIds);

  return campaigns.filter((campaign) => !seen.has(campaign.id));
}

export function shouldRunHubSuperBannerQueue(preferences: MemberPreferences): boolean {
  return preferences.hubFirstVisitCompleted;
}

export async function resolveHubEntryPreferences(owner: string): Promise<{
  preferences: MemberPreferences;
  isFirstHubVisit: boolean;
}> {
  const fallback: MemberPreferences = {
    owner,
    avatarUrl: null,
    streamingOnline: false,
    hubFirstVisitCompleted: false,
    superBannerSeenIds: [],
    tutorialStatus: 'pending',
    tutorialVersion: 0,
    updatedAtMs: Date.now(),
  };

  if (!isMemberPreferencesApiAvailable()) {
    return { preferences: fallback, isFirstHubVisit: true };
  }

  const preferences = (await fetchMemberPreferences(owner)) ?? fallback;
  const isFirstHubVisit = !preferences.hubFirstVisitCompleted;

  return { preferences, isFirstHubVisit };
}

export async function markHubFirstVisitComplete(owner: string): Promise<MemberPreferences | null> {
  if (!isMemberPreferencesApiAvailable()) {
    return null;
  }

  return syncMemberPreferencesToBackend({
    owner,
    hubFirstVisitCompleted: true,
  });
}

export async function markSuperBannerSeen(owner: string, bannerId: string): Promise<void> {
  if (!isMemberPreferencesApiAvailable()) {
    return;
  }

  await syncMemberPreferencesToBackend({
    owner,
    appendSuperBannerSeenId: bannerId,
  });
}

export async function loadPendingHubSuperBanners(owner: string): Promise<SuperBannerQueuePayload[]> {
  const { preferences, isFirstHubVisit } = await resolveHubEntryPreferences(owner);

  if (isFirstHubVisit) {
    await markHubFirstVisitComplete(owner);
    return [];
  }

  if (!shouldRunHubSuperBannerQueue(preferences)) {
    return [];
  }

  const campaigns = await fetchActiveHubSuperBanners();
  return filterUnseenSuperBanners(campaigns, preferences.superBannerSeenIds).map(campaignToQueuePayload);
}

export function dispatchSuperBanner(payload: SuperBannerQueuePayload): void {
  window.dispatchEvent(
    new CustomEvent('nami-super-banner-sent', {
      detail: payload,
    }),
  );
}

export function waitForSuperBannerDismiss(bannerId: string): Promise<void> {
  return new Promise((resolve) => {
    function handleDismiss(event: Event): void {
      const detail = (event as CustomEvent<{ id?: string }>).detail;

      if (detail?.id !== bannerId) {
        return;
      }

      window.removeEventListener('nami-super-banner-dismissed', handleDismiss as EventListener);
      resolve();
    }

    window.addEventListener('nami-super-banner-dismissed', handleDismiss as EventListener);
  });
}

export async function playHubSuperBannerQueue(owner: string): Promise<void> {
  const pending = await loadPendingHubSuperBanners(owner);

  for (const banner of pending) {
    dispatchSuperBanner(banner);
    await waitForSuperBannerDismiss(banner.id);
    await markSuperBannerSeen(owner, banner.id);
  }
}
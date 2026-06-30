import { playHubSuperBannerQueue } from './hub-super-banner-queue.js';
import { consumeTutorialReplaySkipBanners, playTutorialIfPending } from './tutorial-queue.js';

let hubEntryInFlight: Promise<void> | null = null;

async function playHubEntrySequenceInner(owner: string): Promise<void> {
  const skipBannersForReplay = consumeTutorialReplaySkipBanners();

  try {
    if (!skipBannersForReplay) {
      await playHubSuperBannerQueue(owner);
    }

    await playTutorialIfPending(owner);
  } catch (error) {
    console.warn('[nami-hub-entry] sequence failed; continuing to hub', error);
  }
}

/** Hub entry: super banners (return visits) then tutorial v1 when pending. */
export async function playHubEntrySequence(owner: string): Promise<void> {
  if (hubEntryInFlight) {
    return hubEntryInFlight;
  }

  hubEntryInFlight = playHubEntrySequenceInner(owner).finally(() => {
    hubEntryInFlight = null;
  });

  return hubEntryInFlight;
}
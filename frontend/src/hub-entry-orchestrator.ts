import { playHubSuperBannerQueue } from './hub-super-banner-queue.js';
import { consumeTutorialReplaySkipBanners, playTutorialIfPending } from './tutorial-queue.js';

/** Hub entry: super banners (return visits) then tutorial v1 when pending. */
export async function playHubEntrySequence(owner: string): Promise<void> {
  const skipBannersForReplay = consumeTutorialReplaySkipBanners();

  if (!skipBannersForReplay) {
    await playHubSuperBannerQueue(owner);
    await playTutorialIfPending(owner);
    return;
  }

  // Settings replay already dispatched the overlay; skip banner queue and auto-pending play.
}
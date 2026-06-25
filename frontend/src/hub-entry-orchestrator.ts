import { playHubSuperBannerQueue } from './hub-super-banner-queue.js';
import { playTutorialIfPending } from './tutorial-queue.js';

/** Hub entry: super banners (return visits) then tutorial v1 when pending. */
export async function playHubEntrySequence(owner: string): Promise<void> {
  await playHubSuperBannerQueue(owner);
  await playTutorialIfPending(owner);
}
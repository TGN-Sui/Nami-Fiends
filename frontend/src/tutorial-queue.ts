import {
  fetchMemberPreferences,
  isMemberPreferencesApiAvailable,
  syncMemberPreferencesToBackend,
  type MemberPreferences,
  type TutorialStatus,
} from './member-preferences-api.js';
import { TUTORIAL_STEPS_V1, TUTORIAL_VERSION } from './tutorial-registry.js';

export function shouldShowTutorial(preferences: MemberPreferences): boolean {
  return preferences.tutorialStatus === 'pending' || preferences.tutorialVersion < TUTORIAL_VERSION;
}

export async function readTutorialPreferences(owner: string): Promise<MemberPreferences> {
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
    return fallback;
  }

  return (await fetchMemberPreferences(owner)) ?? fallback;
}

export async function playTutorialIfPending(owner: string): Promise<boolean> {
  const preferences = await readTutorialPreferences(owner);

  if (!shouldShowTutorial(preferences)) {
    return false;
  }

  dispatchTutorialPlay(owner);
  await waitForTutorialComplete();
  return true;
}

export async function persistTutorialStatus(
  owner: string,
  status: TutorialStatus,
): Promise<void> {
  if (!isMemberPreferencesApiAvailable()) {
    return;
  }

  await syncMemberPreferencesToBackend({
    owner,
    tutorialStatus: status,
    ...(status === 'completed' ? { tutorialVersion: TUTORIAL_VERSION } : {}),
  });
}

export async function resetTutorialForReplay(owner: string): Promise<void> {
  if (!isMemberPreferencesApiAvailable()) {
    return;
  }

  await syncMemberPreferencesToBackend({
    owner,
    tutorialStatus: 'pending',
    tutorialVersion: 0,
  });
}

export function dispatchTutorialPlay(owner: string, force = false): void {
  window.dispatchEvent(
    new CustomEvent('nami-tutorial-play', {
      detail: { owner, force, steps: TUTORIAL_STEPS_V1 },
    }),
  );
}

export function dispatchTutorialRestart(owner: string): void {
  window.dispatchEvent(
    new CustomEvent('nami-tutorial-restart', {
      detail: { owner },
    }),
  );
}

export function waitForTutorialComplete(): Promise<void> {
  return new Promise((resolve) => {
    function handleComplete(): void {
      window.removeEventListener('nami-tutorial-complete', handleComplete as EventListener);
      resolve();
    }

    window.addEventListener('nami-tutorial-complete', handleComplete as EventListener);
  });
}
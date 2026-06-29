import { isPlatformOwnerAssetsApiAvailable } from './platform-owner-assets-api.js';
import { refreshOwnerAssetsFromServer } from './nami-owner-assets-store.js';

const POLL_INTERVAL_MS = 20000;

let pollHandle: ReturnType<typeof setInterval> | null = null;
let pollSubscriberCount = 0;
let refreshInFlight = false;
let runtimeStarted = false;

async function refreshPlatformOwnerAssetsFromServer(): Promise<void> {
  if (!isPlatformOwnerAssetsApiAvailable() || refreshInFlight) {
    return;
  }

  refreshInFlight = true;

  try {
    await refreshOwnerAssetsFromServer();
  } finally {
    refreshInFlight = false;
  }
}

function onVisibilityChange(): void {
  if (!document.hidden) {
    void refreshPlatformOwnerAssetsFromServer();
  }
}

function ensurePlatformOwnerAssetsSyncRuntime(): void {
  if (runtimeStarted) {
    return;
  }

  runtimeStarted = true;
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function startPlatformOwnerAssetsPolling(): void {
  pollSubscriberCount += 1;

  if (pollHandle) {
    return;
  }

  ensurePlatformOwnerAssetsSyncRuntime();
  void refreshPlatformOwnerAssetsFromServer();

  pollHandle = setInterval(() => {
    void refreshPlatformOwnerAssetsFromServer();
  }, POLL_INTERVAL_MS);
}

function stopPlatformOwnerAssetsPolling(): void {
  pollSubscriberCount = Math.max(0, pollSubscriberCount - 1);

  if (pollSubscriberCount > 0 || !pollHandle) {
    return;
  }

  clearInterval(pollHandle);
  pollHandle = null;
}

export function startPlatformOwnerAssetsAppSync(): () => void {
  startPlatformOwnerAssetsPolling();

  return () => {
    stopPlatformOwnerAssetsPolling();
  };
}
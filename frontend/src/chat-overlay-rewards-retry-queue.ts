import {
  chatOverlayRewardsSyncErrorMessage,
  syncChatOverlayRewardsToServer,
  type ChatOverlayRewardsSyncError,
} from './chat-overlay-rewards-sync.js';
import { isChatOverlayRewardsApiAvailable } from './chat-overlay-rewards-api.js';
import type { OfficialChatOverlayReward } from './official-chat-overlay-rewards-store.js';
import { pushNamiToast } from './nami-toast-store.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';
import {
  canSignWalletAuthWithZkLogin,
  hasWalletAuthSigner,
  readWalletAuthOwner,
} from './wallet-auth.js';
import { readWalletAuthRequired } from './protocol-env.js';

const RETRY_DELAYS_MS = [2000, 5000, 12000, 30000];
const AUTH_READY_DEFER_MS = 400;
const MAX_ATTEMPTS = 6;

type PendingCatalogSync = {
  rewards: OfficialChatOverlayReward[];
  owner: string | null;
  attempts: number;
  nextRetryAtMs: number;
  lastError: ChatOverlayRewardsSyncError | null;
  toastShown: boolean;
  userInitiated: boolean;
};

let pendingSync: PendingCatalogSync | null = null;
let retryHandle: ReturnType<typeof setInterval> | null = null;
let retrySubscriberCount = 0;
let processInFlight = false;
let catalogSyncOwner: string | null = null;

function retryDelayMs(attempts: number): number {
  return RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)] ?? 30000;
}

function resolveCatalogSyncOwner(preferredOwner: string | null = null): string | null {
  if (preferredOwner?.startsWith('0x')) {
    return preferredOwner;
  }

  return readResolvedProtocolOwner() ?? catalogSyncOwner ?? readWalletAuthOwner();
}

function isRetryableError(error: ChatOverlayRewardsSyncError): boolean {
  if (
    error === 'not_configured' ||
    error === 'official_owner_required' ||
    error === 'invalid_file_size' ||
    error === 'invalid_art_value'
  ) {
    return false;
  }

  return (
    error === 'no_owner' ||
    error === 'request_failed' ||
    error === 'quilt_publish_failed' ||
    error === 'wallet_auth_unavailable' ||
    error === 'wallet_auth_required' ||
    error === 'wallet_auth_invalid'
  );
}

function isCatalogSyncAuthReady(owner: string | null): boolean {
  return Boolean(
    owner?.startsWith('0x') && (canSignWalletAuthWithZkLogin(owner) || hasWalletAuthSigner())
  );
}

function shouldDeferForAuthReadiness(owner: string | null): boolean {
  return Boolean(owner?.startsWith('0x') && readWalletAuthRequired() && !isCatalogSyncAuthReady(owner));
}

function notifyCatalogSyncOutcome(
  result: { ok: true } | { ok: false; error: ChatOverlayRewardsSyncError },
  pending: PendingCatalogSync
): void {
  if (result.ok) {
    if (pending.attempts > 0 || pending.lastError === 'no_owner') {
      pushNamiToast('Border art catalog synced to the server.', 'success');
    }

    return;
  }

  if (!pending.userInitiated) {
    return;
  }

  if (!pending.toastShown) {
    pushNamiToast(chatOverlayRewardsSyncErrorMessage(result.error), 'error');
    pending.toastShown = true;
    return;
  }

  if (pending.attempts >= MAX_ATTEMPTS && isRetryableError(result.error)) {
    pushNamiToast(
      'Border art is saved locally, but server sync is still failing. Try saving again later.',
      'error',
      7000
    );
  }
}

export function readPendingChatOverlayCatalogSync(): PendingCatalogSync | null {
  return pendingSync;
}

export function enqueueChatOverlayCatalogSync(
  rewards: OfficialChatOverlayReward[],
  owner: string | null,
  options?: { userInitiated?: boolean }
): void {
  if (!isChatOverlayRewardsApiAvailable()) {
    return;
  }

  pendingSync = {
    rewards: rewards.map((reward) => ({ ...reward })),
    owner: resolveCatalogSyncOwner(owner),
    attempts: 0,
    nextRetryAtMs: Date.now(),
    lastError: null,
    toastShown: false,
    userInitiated: options?.userInitiated ?? true,
  };

  void processChatOverlayCatalogSyncQueue();
}

/** Called after WalletAuthBridge registers a live signer. */
export function notifyCatalogSyncAuthReady(): void {
  if (!pendingSync) {
    return;
  }

  pendingSync.nextRetryAtMs = Date.now();

  if (pendingSync.lastError === 'wallet_auth_unavailable') {
    pendingSync.attempts = 0;
    pendingSync.toastShown = false;
  }

  void processChatOverlayCatalogSyncQueue();
}

/** Pick up a newly connected owner wallet and retry any locally saved catalog. */
export function refreshChatOverlayCatalogSyncOwner(owner: string | null): void {
  const resolvedOwner = resolveCatalogSyncOwner(owner);

  if (!resolvedOwner?.startsWith('0x')) {
    return;
  }

  catalogSyncOwner = resolvedOwner;

  if (!pendingSync) {
    return;
  }

  pendingSync.owner = resolvedOwner;
  pendingSync.nextRetryAtMs = Date.now();
  pendingSync.userInitiated = false;

  if (pendingSync.lastError === 'no_owner' || pendingSync.lastError === 'wallet_auth_unavailable') {
    pendingSync.attempts = 0;
    pendingSync.toastShown = false;
  }

  void processChatOverlayCatalogSyncQueue();
}

export async function processChatOverlayCatalogSyncQueue(): Promise<boolean> {
  if (!pendingSync || processInFlight) {
    return false;
  }

  if (Date.now() < pendingSync.nextRetryAtMs) {
    return false;
  }

  const job = pendingSync;
  processInFlight = true;

  try {
    const owner = resolveCatalogSyncOwner(job.owner);
    job.owner = owner;

    if (shouldDeferForAuthReadiness(owner)) {
      job.nextRetryAtMs = Date.now() + AUTH_READY_DEFER_MS;
      pendingSync = job;
      return false;
    }

    const result = await syncChatOverlayRewardsToServer(job.rewards, owner);

    if (result.ok) {
      notifyCatalogSyncOutcome(result, job);
      pendingSync = null;
      return true;
    }

    job.lastError = result.error;
    job.attempts += 1;
    notifyCatalogSyncOutcome(result, job);

    if (!isRetryableError(result.error) || job.attempts >= MAX_ATTEMPTS) {
      pendingSync = null;
      return false;
    }

    job.nextRetryAtMs = Date.now() + retryDelayMs(job.attempts);
    pendingSync = job;
    return false;
  } finally {
    processInFlight = false;
  }
}

export function startChatOverlayCatalogRetryLoop(): () => void {
  retrySubscriberCount += 1;

  if (!retryHandle) {
    retryHandle = setInterval(() => {
      void processChatOverlayCatalogSyncQueue();
    }, 1500);
  }

  return () => {
    retrySubscriberCount = Math.max(0, retrySubscriberCount - 1);

    if (retrySubscriberCount === 0 && retryHandle) {
      clearInterval(retryHandle);
      retryHandle = null;
    }
  };
}

export function resetChatOverlayCatalogRetryQueueForTests(): void {
  pendingSync = null;
  processInFlight = false;
  catalogSyncOwner = null;

  if (retryHandle) {
    clearInterval(retryHandle);
    retryHandle = null;
  }

  retrySubscriberCount = 0;
}
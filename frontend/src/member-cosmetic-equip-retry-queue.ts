import {
  memberCosmeticEquipSyncErrorMessage,
  type MemberCosmeticEquipSyncError,
} from './member-cosmetic-equip-sync-errors.js';
import {
  syncEquippedChatOverlayToServer,
  type MemberCosmeticEquipSyncResult,
} from './member-cosmetic-equips-store.js';
import { pushNamiToast } from './nami-toast-store.js';

const RETRY_DELAYS_MS = [2000, 5000, 12000, 30000];
const MAX_ATTEMPTS = 6;

type PendingEquipSync = {
  memberId: string;
  overlayId: string;
  owner: string | null;
  attempts: number;
  nextRetryAtMs: number;
  lastError: MemberCosmeticEquipSyncError | null;
  toastShown: boolean;
};

let pendingSync: PendingEquipSync | null = null;
let retryHandle: ReturnType<typeof setInterval> | null = null;
let retrySubscriberCount = 0;
let processInFlight = false;

function retryDelayMs(attempts: number): number {
  return RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)] ?? 30000;
}

function isRetryableError(error: MemberCosmeticEquipSyncError): boolean {
  return (
    error === 'request_failed' ||
    error === 'wallet_auth_unavailable' ||
    error === 'wallet_auth_required' ||
    error === 'wallet_auth_invalid'
  );
}

function notifyEquipSyncOutcome(
  result: MemberCosmeticEquipSyncResult,
  pending: PendingEquipSync
): void {
  if (result.ok) {
    if (pending.attempts > 0) {
      pushNamiToast('Chat border equip synced to the server.', 'success');
    }

    return;
  }

  if (!pending.toastShown) {
    pushNamiToast(memberCosmeticEquipSyncErrorMessage(result.error), 'error');
    pending.toastShown = true;
    return;
  }

  if (pending.attempts >= MAX_ATTEMPTS && isRetryableError(result.error)) {
    pushNamiToast(
      'Chat border equip is saved locally, but server sync is still failing. Try equipping again later.',
      'error',
      7000
    );
  }
}

export function readPendingEquippedChatOverlaySync(): PendingEquipSync | null {
  return pendingSync;
}

export function enqueueEquippedChatOverlaySync(
  memberId: string,
  overlayId: string,
  owner: string | null
): void {
  pendingSync = {
    memberId,
    overlayId,
    owner,
    attempts: 0,
    nextRetryAtMs: Date.now(),
    lastError: null,
    toastShown: false,
  };

  void processEquippedChatOverlaySyncQueue();
}

export async function processEquippedChatOverlaySyncQueue(): Promise<boolean> {
  if (!pendingSync || processInFlight) {
    return false;
  }

  if (Date.now() < pendingSync.nextRetryAtMs) {
    return false;
  }

  const job = pendingSync;
  processInFlight = true;

  try {
    const result = await syncEquippedChatOverlayToServer(job.memberId, job.overlayId, job.owner);

    if (result.ok) {
      notifyEquipSyncOutcome(result, job);
      pendingSync = null;
      return true;
    }

    job.lastError = result.error;
    job.attempts += 1;
    notifyEquipSyncOutcome(result, job);

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

export function startEquippedChatOverlayRetryLoop(): () => void {
  retrySubscriberCount += 1;

  if (!retryHandle) {
    retryHandle = setInterval(() => {
      void processEquippedChatOverlaySyncQueue();
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

export function resetEquippedChatOverlayRetryQueueForTests(): void {
  pendingSync = null;
  processInFlight = false;

  if (retryHandle) {
    clearInterval(retryHandle);
    retryHandle = null;
  }

  retrySubscriberCount = 0;
}
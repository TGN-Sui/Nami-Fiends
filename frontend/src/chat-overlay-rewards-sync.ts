import {
  ChatOverlayRewardsApiError,
  type ChatOverlayRewardsApiErrorCode,
  fetchChatOverlayRewardsCatalog,
  isChatOverlayRewardsApiAvailable,
  syncChatOverlayRewardsCatalog,
} from './chat-overlay-rewards-api.js';
import {
  saveOfficialChatOverlayRewards,
  type OfficialChatOverlayReward,
} from './official-chat-overlay-rewards-store.js';

export type ChatOverlayRewardsSyncError = ChatOverlayRewardsApiErrorCode | 'no_owner';

let lastSyncError: ChatOverlayRewardsSyncError | null = null;

export function readLastChatOverlayRewardsSyncError(): ChatOverlayRewardsSyncError | null {
  return lastSyncError;
}

export function chatOverlayRewardsSyncErrorMessage(error: ChatOverlayRewardsSyncError): string {
  if (error === 'not_configured') {
    return 'Receiving server is not configured. Set VITE_NAMI_INDEXER_URL on your deploy.';
  }

  if (error === 'no_owner') {
    return 'Connect your official owner wallet or zkLogin session, then save again.';
  }

  if (error === 'wallet_auth_unavailable') {
    return 'Reconnect zkLogin or your official owner wallet to authorize border art uploads, then save again.';
  }

  if (error === 'wallet_auth_required' || error === 'wallet_auth_invalid') {
    return 'Wallet signature was rejected. Reconnect zkLogin or your wallet extension, then save again.';
  }

  if (error === 'official_owner_required') {
    return 'This deploy only accepts border art from the configured official owner wallet.';
  }

  if (error === 'invalid_file_size') {
    return 'One of the border art files is too large for the receiving server. Upload a smaller image.';
  }

  if (error === 'invalid_art_value') {
    return 'One of the border art slots still points at local-only media. Re-upload that art, then save again.';
  }

  return 'Could not sync border art to the receiving server. Check your connection and try again.';
}

function mapSyncError(error: unknown): ChatOverlayRewardsSyncError {
  if (error instanceof ChatOverlayRewardsApiError) {
    return error.code;
  }

  return 'request_failed';
}

export async function hydrateChatOverlayRewardsFromServer(): Promise<boolean> {
  if (!isChatOverlayRewardsApiAvailable()) {
    return false;
  }

  try {
    const catalog = await fetchChatOverlayRewardsCatalog();

    if (!Array.isArray(catalog.rewards) || catalog.rewards.length === 0) {
      return false;
    }

    saveOfficialChatOverlayRewards(catalog.rewards);
    return true;
  } catch {
    return false;
  }
}

export async function syncChatOverlayRewardsToServer(
  rewards: OfficialChatOverlayReward[],
  owner: string | null
): Promise<
  | { ok: true; rewards: OfficialChatOverlayReward[] }
  | { ok: false; error: ChatOverlayRewardsSyncError }
> {
  if (!isChatOverlayRewardsApiAvailable()) {
    lastSyncError = 'not_configured';
    return { ok: false, error: 'not_configured' };
  }

  if (!owner?.startsWith('0x')) {
    lastSyncError = 'no_owner';
    return { ok: false, error: 'no_owner' };
  }

  try {
    const catalog = await syncChatOverlayRewardsCatalog(rewards, owner);
    const syncedRewards = catalog.rewards ?? [];
    saveOfficialChatOverlayRewards(syncedRewards);
    lastSyncError = null;
    return { ok: true, rewards: syncedRewards };
  } catch (error) {
    lastSyncError = mapSyncError(error);
    return { ok: false, error: lastSyncError };
  }
}
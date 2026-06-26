import type { MemberCosmeticEquipsApiErrorCode } from './member-cosmetic-equips-api.js';

export type MemberCosmeticEquipSyncError =
  | MemberCosmeticEquipsApiErrorCode
  | 'no_owner'
  | 'api_unavailable';

export function memberCosmeticEquipSyncErrorMessage(error: MemberCosmeticEquipSyncError): string {
  if (error === 'api_unavailable') {
    return 'Border equipped locally. Server sync is unavailable on this deploy.';
  }

  if (error === 'not_configured') {
    return 'Border equipped locally. Set VITE_NAMI_INDEXER_URL to sync across devices.';
  }

  if (error === 'no_owner') {
    return 'Border equipped locally. Connect your wallet or zkLogin to sync to the server.';
  }

  if (error === 'wallet_auth_unavailable') {
    return 'Border equipped locally. Finish account sign-in in Settings, then equip again to authorize server sync.';
  }

  if (error === 'wallet_auth_required' || error === 'wallet_auth_invalid') {
    return 'Wallet signature was rejected. Reconnect zkLogin or your wallet, then equip again.';
  }

  return 'Border equipped locally, but the server sync failed. We will keep retrying in the background.';
}
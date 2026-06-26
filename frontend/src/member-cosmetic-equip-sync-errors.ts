import type { MemberCosmeticEquipsApiErrorCode } from './member-cosmetic-equips-api.js';
import {
  hasWalletAuthSigner,
  readWalletAuthContext,
  readWalletAuthOwner,
} from './wallet-auth.js';

export type MemberCosmeticEquipSyncError =
  | MemberCosmeticEquipsApiErrorCode
  | 'no_owner'
  | 'api_unavailable';

function shortenOwnerAddress(owner: string): string {
  if (owner.length <= 12) {
    return owner;
  }

  return owner.slice(0, 8) + '…' + owner.slice(-4);
}

function equipSyncAuthHint(): string {
  const owner = readWalletAuthOwner();
  const { source } = readWalletAuthContext();

  if (!owner?.startsWith('0x')) {
    return 'Border equipped locally. Connect your wallet or zkLogin to sync to the server.';
  }

  const address = shortenOwnerAddress(owner);

  if (!hasWalletAuthSigner()) {
    if (source === 'zklogin') {
      return (
        'Border equipped locally. Finish Google zkLogin for ' +
        address +
        ', wait a moment for sign-in to finish, then equip again.'
      );
    }

    if (source === 'linked') {
      return (
        'Border equipped locally. Connect the Sui wallet extension using your linked address (' +
        address +
        '), or sign in with Google zkLogin on that same wallet, then equip again.'
      );
    }

    return (
      'Border equipped locally. Connect your wallet or zkLogin for ' +
      address +
      ', then equip again.'
    );
  }

  return 'Border equipped locally. Re-authorize account sign-in in Settings, then equip again.';
}

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
    return equipSyncAuthHint();
  }

  if (error === 'wallet_auth_required' || error === 'wallet_auth_invalid') {
    return 'Wallet signature was rejected. Reconnect zkLogin or your wallet, then equip again.';
  }

  return 'Border equipped locally, but the server sync failed. We will keep retrying in the background.';
}
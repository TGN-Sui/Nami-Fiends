import type { MemberCosmeticEquipsApiErrorCode } from './member-cosmetic-equips-api.js';
import {
  hasWalletAuthSigner,
  readWalletAuthContext,
  readWalletAuthOwner,
} from './wallet-auth.js';
import { canZkLoginSignForOwner } from './zklogin.js';

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
      if (!canZkLoginSignForOwner(owner)) {
        return (
          'Border equipped locally. Sign out, sign in with Google again to refresh zkLogin signing for ' +
          address +
          ', then equip the border.'
        );
      }

      return (
        'Border equipped locally. Wait a moment for zkLogin sign-in to finish for ' +
        address +
        ', then equip again.'
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

  if (source === 'zklogin') {
    return (
      'Border equipped locally. zkLogin signing is not ready for ' +
      address +
      '. Sign out, sign in with Google again, then equip the border.'
    );
  }

  return 'Border equipped locally. Reconnect your wallet or zkLogin in Settings, then equip again.';
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
    const owner = readWalletAuthOwner();
    const { source } = readWalletAuthContext();

    if (source === 'zklogin' || canZkLoginSignForOwner(owner)) {
      return (
        'Wallet signature was rejected for your zkLogin session. Sign out, sign in with Google again, then equip the border.'
      );
    }

    return 'Wallet signature was rejected. Reconnect zkLogin or your wallet, then equip again.';
  }

  return 'Border equipped locally, but the server sync failed. We will keep retrying in the background.';
}
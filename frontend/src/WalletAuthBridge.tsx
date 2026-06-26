import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { useEffect, useState, type ReactElement } from 'react';

import { isMemberVerified } from './member-access.js';
import { useSelfMember } from './member-avatar-store.js';
import { notifyEquipSyncAuthReady } from './member-cosmetic-equip-retry-queue.js';
import { useProtocolOwner } from './wallet.js';
import {
  buildWalletAuthMessage,
  registerWalletAuthSigner,
  setWalletAuthContext,
} from './wallet-auth.js';
import { getZkLoginSession } from './zklogin.js';

function useZkLoginSessionRevision(): number {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    function bumpRevision(): void {
      setRevision((value) => value + 1);
    }

    function onStorage(event: StorageEvent): void {
      if (event.key === 'nami.zklogin.session') {
        bumpRevision();
      }
    }

    window.addEventListener('nami-zklogin-session-ready', bumpRevision);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('nami-zklogin-session-ready', bumpRevision);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return revision;
}

export function WalletAuthBridge(): ReactElement | null {
  const { owner, source } = useProtocolOwner();
  const walletAccount = useCurrentAccount();
  const selfMember = useSelfMember();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const zkLoginSessionRevision = useZkLoginSessionRevision();

  useEffect(() => {
    setWalletAuthContext({
      owner,
      source: source as 'wallet' | 'zklogin' | 'demo' | 'linked' | null,
      memberVerified: isMemberVerified(selfMember),
    });

    const extensionMatchesOwner = Boolean(
      walletAccount?.address &&
        owner &&
        walletAccount.address.toLowerCase() === owner.toLowerCase()
    );
    const zkSession = getZkLoginSession();
    const zkSessionMatchesOwner = Boolean(
      owner &&
        zkSession?.ephemeralSecretKey &&
        zkSession.address.toLowerCase() === owner.toLowerCase()
    );

    if (zkSessionMatchesOwner) {
      registerWalletAuthSigner(async (signOwner) => {
        const session = getZkLoginSession();

        if (
          !session?.ephemeralSecretKey ||
          session.address.toLowerCase() !== signOwner.toLowerCase()
        ) {
          throw new Error('Reconnect zkLogin to sign server uploads.');
        }

        const keypair = Ed25519Keypair.fromSecretKey(session.ephemeralSecretKey);
        const signerAddress = keypair.getPublicKey().toSuiAddress();
        const timestampMs = Date.now();
        const message = buildWalletAuthMessage(signOwner, timestampMs);
        const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(message));

        return {
          signature,
          timestampMs,
          signerAddress,
        };
      });
      notifyEquipSyncAuthReady();

      return () => {
        registerWalletAuthSigner(null);
      };
    }

    if (extensionMatchesOwner) {
      registerWalletAuthSigner(async (signOwner) => {
        const timestampMs = Date.now();
        const message = buildWalletAuthMessage(signOwner, timestampMs);
        const bytes = new TextEncoder().encode(message);
        const result = await signPersonalMessage({ message: bytes });

        return {
          signature: result.signature,
          timestampMs,
        };
      });
      notifyEquipSyncAuthReady();

      return () => {
        registerWalletAuthSigner(null);
      };
    }

    registerWalletAuthSigner(null);

    return () => {
      registerWalletAuthSigner(null);
    };
  }, [
    owner,
    source,
    selfMember,
    signPersonalMessage,
    walletAccount?.address,
    zkLoginSessionRevision,
  ]);

  return null;
}
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { useEffect, type ReactElement } from 'react';

import { isMemberVerified } from './member-access.js';
import { useSelfMember } from './member-avatar-store.js';
import { useProtocolOwner } from './wallet.js';
import {
  buildWalletAuthMessage,
  registerWalletAuthSigner,
  setWalletAuthContext,
} from './wallet-auth.js';
import { getZkLoginSession } from './zklogin.js';

export function WalletAuthBridge(): ReactElement | null {
  const { owner, source } = useProtocolOwner();
  const walletAccount = useCurrentAccount();
  const selfMember = useSelfMember();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

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
    const walletConnected = source === 'wallet' || (source === 'linked' && extensionMatchesOwner) || extensionMatchesOwner;

    if (walletConnected) {
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

      return () => {
        registerWalletAuthSigner(null);
      };
    }

    if (source === 'zklogin' && owner) {
      registerWalletAuthSigner(async (signOwner) => {
        const session = getZkLoginSession();

        if (
          !session?.ephemeralSecretKey ||
          session.address.toLowerCase() !== signOwner.toLowerCase()
        ) {
          throw new Error('Reconnect zkLogin to sign server uploads.');
        }

        const keypair = Ed25519Keypair.fromSecretKey(session.ephemeralSecretKey);
        const timestampMs = Date.now();
        const message = buildWalletAuthMessage(signOwner, timestampMs);
        const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(message));

        return {
          signature,
          timestampMs,
        };
      });

      return () => {
        registerWalletAuthSigner(null);
      };
    }

    registerWalletAuthSigner(null);

    return () => {
      registerWalletAuthSigner(null);
    };
  }, [owner, source, selfMember, signPersonalMessage, walletAccount?.address]);

  return null;
}
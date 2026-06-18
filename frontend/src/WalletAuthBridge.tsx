import { useSignPersonalMessage } from '@mysten/dapp-kit';
import { useEffect, type ReactElement } from 'react';

import { isMemberVerified } from './member-access.js';
import { useSelfMember } from './member-avatar-store.js';
import { useProtocolOwner } from './wallet.js';
import {
  buildWalletAuthMessage,
  registerWalletAuthSigner,
  setWalletAuthContext,
} from './wallet-auth.js';

const EMPTY_AUTH_CONTEXT = {
  owner: null,
  source: null,
  memberVerified: false,
} as const;

export function WalletAuthBridge(): ReactElement | null {
  const { owner, source } = useProtocolOwner();
  const selfMember = useSelfMember();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  useEffect(() => {
    setWalletAuthContext({
      owner,
      source,
      memberVerified: isMemberVerified(selfMember),
    });

    if (source !== 'wallet') {
      registerWalletAuthSigner(null);
      return () => {
        registerWalletAuthSigner(null);
        setWalletAuthContext(EMPTY_AUTH_CONTEXT);
      };
    }

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
      setWalletAuthContext(EMPTY_AUTH_CONTEXT);
    };
  }, [owner, source, selfMember, signPersonalMessage]);

  return null;
}
import { useSignPersonalMessage } from '@mysten/dapp-kit';
import { useEffect, type ReactElement } from 'react';

import { buildWalletAuthMessage, registerWalletAuthSigner } from './wallet-auth.js';

export function WalletAuthBridge(): ReactElement | null {
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  useEffect(() => {
    registerWalletAuthSigner(async (owner) => {
      const timestampMs = Date.now();
      const message = buildWalletAuthMessage(owner, timestampMs);
      const bytes = new TextEncoder().encode(message);
      const result = await signPersonalMessage({ message: bytes });

      return {
        signature: result.signature,
        timestampMs,
      };
    });

    return () => registerWalletAuthSigner(null);
  }, [signPersonalMessage]);

  return null;
}
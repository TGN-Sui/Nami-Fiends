import {
  ConnectButton,
  createNetworkConfig,
  SuiClientProvider,
  useCurrentAccount,
  useDisconnectWallet,
  WalletProvider,
} from '@mysten/dapp-kit';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { shouldUseDemoOwnerFallback } from './app-config.js';
import { getConfiguredNetwork } from './nami.js';
import { resolveProtocolConnectionState } from './protocol-availability.js';
import { readDemoOwner } from './protocol-env.js';
import { getProtocolContext, type ProtocolContext, type ProtocolDataMode } from './protocol.js';
import {
  clearZkLoginSession,
  completeZkLoginFromRedirect,
  getZkLoginSession,
  isZkLoginConfigured,
  startZkLoginFlow,
  type ZkLoginSession,
} from './zklogin.js';

import '@mysten/dapp-kit/dist/index.css';

export type ProtocolOwnerSource = 'wallet' | 'zklogin' | 'demo' | null;

const { networkConfig } = createNetworkConfig({
  localnet: {
    url: import.meta.env.VITE_SUI_FULLNODE_URL ?? 'http://127.0.0.1:9000',
    network: 'localnet',
  },
  devnet: { url: getJsonRpcFullnodeUrl('devnet'), network: 'devnet' },
  testnet: { url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' },
  mainnet: { url: getJsonRpcFullnodeUrl('mainnet'), network: 'mainnet' },
});

const queryClient = new QueryClient();

export function NamiWalletProvider(props: { children: ReactNode }): ReactElement {
  const network = getConfiguredNetwork() as keyof typeof networkConfig;

  useEffect(() => {
    void completeZkLoginFromRedirect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
        <WalletProvider autoConnect>
          {props.children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export function WalletConnectControl(): ReactElement {
  return (
    <div className="nami-connect-button-shell" data-nami-connect-label="Link account">
      <ConnectButton />
    </div>
  );
}

function useZkLoginSessionState(): ZkLoginSession | null {
  const [session, setSession] = useState<ZkLoginSession | null>(() => getZkLoginSession());

  useEffect(() => {
    let cancelled = false;

    void completeZkLoginFromRedirect().then((nextSession) => {
      if (!cancelled && nextSession) {
        setSession(nextSession);
      }
    });

    function onStorage(event: StorageEvent): void {
      if (event.key === 'nami.zklogin.session') {
        setSession(getZkLoginSession());
      }
    }

    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return session;
}

export function ZkLoginConnectControl(): ReactElement {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useZkLoginSessionState();

  const handleStart = useCallback(() => {
    setError(null);
    setPending(true);

    void startZkLoginFlow().catch((startError) => {
      setPending(false);
      setError(
        startError instanceof Error ? startError.message : 'Could not start zkLogin flow.'
      );
    });
  }, []);

  if (session) {
    return (
      <div className="zklogin-connect">
        <p className="protocol-hint">
          Signed in · {session.address.slice(0, 10)}…
        </p>
        <button
          className="onboarding-secondary-btn"
          onClick={() => {
            clearZkLoginSession();
            window.location.reload();
          }}
          type="button"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="zklogin-connect">
      <button
        className="onboarding-primary-btn"
        disabled={!isZkLoginConfigured() || pending}
        onClick={handleStart}
        type="button"
      >
        {pending ? 'Redirecting…' : 'Sign in with Google'}
      </button>
      {error ? <p className="onboarding-field-error">{error}</p> : null}
    </div>
  );
}

export function useProtocolOwner(): {
  owner: string | null;
  source: ProtocolOwnerSource;
  context: ProtocolContext;
  mode: ProtocolDataMode;
} {
  const account = useCurrentAccount();
  const zkSession = useZkLoginSessionState();
  const context = useMemo(() => getProtocolContext(), []);
  const demoOwner = shouldUseDemoOwnerFallback() ? readDemoOwner() : null;
  const walletOwner = account?.address ?? null;
  const zkOwner = zkSession?.address ?? null;
  const owner = walletOwner ?? zkOwner ?? demoOwner;
  const source: ProtocolOwnerSource = walletOwner
    ? 'wallet'
    : zkOwner
      ? 'zklogin'
      : demoOwner
        ? 'demo'
        : null;

  const mode: ProtocolDataMode =
    context.chain !== null && owner !== null && owner.startsWith('0x') ? 'live' : 'mock';

  return {
    owner,
    source,
    context,
    mode,
  };
}

export function protocolOwnerStatusLabel(
  context: ProtocolContext,
  owner: string | null,
  source: ProtocolOwnerSource
): string {
  return resolveProtocolConnectionState(context, owner, source).detail;
}

export function useWalletDisconnect(): () => Promise<void> {
  const { mutateAsync: disconnect } = useDisconnectWallet();

  return async () => {
    clearZkLoginSession();
    await disconnect();
  };
}
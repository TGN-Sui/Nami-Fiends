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

import { hasActiveMemberSession } from './member-session-store.js';
import { setLastWalletOwner } from './protocol-owner-snapshot.js';
import { getConfiguredNetwork } from './nami.js';
import { resolveProtocolConnectionState } from './protocol-availability.js';
import {
  resolveProtocolOwnerState,
  type ResolvedProtocolOwnerSource,
} from './protocol-owner-resolve.js';
import { getProtocolContext, type ProtocolContext, type ProtocolDataMode } from './protocol.js';
import { useMemberSession } from './member-session-store.js';
import { zkLoginLaunchReadinessMessage } from './onboarding-recovery.js';
import {
  clearZkLoginSession,
  clearZkLoginSessionIfExpired,
  completeZkLoginFromRedirect,
  getZkLoginSession,
  isZkLoginConfigured,
  readZkLoginLastError,
  startZkLoginFlow,
  type ZkLoginSession,
} from './zklogin.js';

import '@mysten/dapp-kit/dist/index.css';

export type ProtocolOwnerSource = ResolvedProtocolOwnerSource;

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
    void clearZkLoginSessionIfExpired().then(() => completeZkLoginFromRedirect());
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

function useZkLoginSessionState(): {
  session: ZkLoginSession | null;
  redirectError: string | null;
  setRedirectError: (message: string | null) => void;
} {
  const [session, setSession] = useState<ZkLoginSession | null>(() => getZkLoginSession());
  const [redirectError, setRedirectError] = useState<string | null>(() => readZkLoginLastError());

  useEffect(() => {
    let cancelled = false;

    void completeZkLoginFromRedirect().then((nextSession) => {
      if (cancelled) {
        return;
      }

      const callbackError = readZkLoginLastError();

      if (callbackError) {
        setRedirectError(callbackError);
      }

      if (nextSession) {
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

  return { session, redirectError, setRedirectError };
}

export function ZkLoginConnectControl(): ReactElement {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, redirectError, setRedirectError } = useZkLoginSessionState();

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
    const memberLinked = hasActiveMemberSession();

    return (
      <div className="zklogin-connect">
        <p className="protocol-hint">
          Google wallet connected · {session.address.slice(0, 10)}…
        </p>
        {!memberLinked ? (
          <p className="protocol-hint">
            Complete gamer signup or log in with email to link your Nami passport to this wallet.
          </p>
        ) : null}
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

  const readinessMessage = zkLoginLaunchReadinessMessage();
  const displayError = error ?? redirectError;

  return (
    <div className="zklogin-connect">
      <button
        className="onboarding-primary-btn"
        disabled={!isZkLoginConfigured() || pending}
        onClick={() => {
          setRedirectError(null);
          handleStart();
        }}
        type="button"
      >
        {pending ? 'Redirecting…' : 'Sign in with Google'}
      </button>
      <small className="protocol-hint">{readinessMessage}</small>
      {displayError ? <p className="onboarding-field-error">{displayError}</p> : null}
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
  const { session: zkSession } = useZkLoginSessionState();
  const memberSession = useMemberSession();
  const context = useMemo(() => getProtocolContext(), []);
  const walletOwner = account?.address ?? null;

  useEffect(() => {
    setLastWalletOwner(walletOwner);
  }, [walletOwner]);

  const resolved = useMemo(
    () => resolveProtocolOwnerState(),
    [walletOwner, zkSession?.address, memberSession?.email],
  );
  const owner = resolved.owner;
  const source = resolved.source;

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
    setLastWalletOwner(null);
    await disconnect();
  };
}
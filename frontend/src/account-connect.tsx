import { type ReactElement } from 'react';

import {
  useProtocolOwner,
  useWalletDisconnect,
  WalletConnectControl,
  ZkLoginConnectControl,
} from './wallet.js';

function shortenAccountId(value: string): string {
  if (value.length <= 12) {
    return value;
  }

  return value.slice(0, 8) + '…' + value.slice(-4);
}

export function AccountConnectSection(): ReactElement {
  const { owner, source } = useProtocolOwner();
  const disconnect = useWalletDisconnect();

  return (
    <article className="panel settings-card settings-account-connect-card">
      <div className="profile-panel-heading">
        <h2>Account Sign-In</h2>
        <p>
          Link your Nami account to save progress, verify membership, and unlock Elite creator
          tools. No technical setup required.
        </p>
      </div>

      {owner ? (
        <div className="settings-account-connected">
          <span className="mini-badge">Signed in</span>
          <strong>{shortenAccountId(owner)}</strong>
          <p className="settings-account-source">
            {source === 'zklogin'
              ? 'Signed in with your connected account.'
              : source === 'linked'
                ? 'Owner wallet linked to your email session.'
                : source === 'demo'
                  ? 'Preview session active.'
                  : 'Account linked and ready.'}
          </p>
          <button
            className="profile-secondary-link"
            onClick={() => void disconnect()}
            type="button"
          >
            Sign out
          </button>
        </div>
      ) : (
        <p className="settings-account-hint">
          Sign in to sync your passport, badges, and chat privileges across devices.
        </p>
      )}

      <div className="settings-account-connect-actions">
        <div className="settings-account-connect-block">
          <span className="settings-account-connect-label">Sign in with account</span>
          <ZkLoginConnectControl />
        </div>

        <div className="settings-account-connect-block">
          <span className="settings-account-connect-label">Sui wallet</span>
          <p className="protocol-hint">
            Connect a Sui wallet for on-chain purchases, tips, and passport ownership.
          </p>
          <WalletConnectControl />
        </div>
      </div>
    </article>
  );
}
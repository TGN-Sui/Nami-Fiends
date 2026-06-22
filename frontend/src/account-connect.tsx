import { type ReactElement } from 'react';

import { isTestLaunchMode } from './app-config.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { readOfficialOwner, readOfficialOwnerEmail } from './protocol-env.js';
import { getZkLoginSession } from './zklogin.js';
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
  const zkSession = getZkLoginSession();
  const configuredOwner = readOfficialOwner();
  const officialEmail = readOfficialOwnerEmail();
  const ownerAligned = isOfficialOwner(owner);
  const zkMatchesConfigured =
    zkSession &&
    configuredOwner &&
    zkSession.address.toLowerCase() === configuredOwner.toLowerCase();

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
                : source === 'demo' && !isTestLaunchMode()
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

      {isTestLaunchMode() && zkSession ? (
        <div className="settings-account-owner-diagnostics panel">
          <span className="mini-badge">{ownerAligned ? 'Owner wallet' : 'Wallet check'}</span>
          <p className="protocol-hint">
            <strong>Your Google zkLogin address:</strong>
            <br />
            <code>{zkSession.address}</code>
          </p>
          {configuredOwner ? (
            <p className="protocol-hint">
              <strong>Configured official owner (Vercel):</strong>
              <br />
              <code>{configuredOwner}</code>
            </p>
          ) : (
            <p className="onboarding-field-error">
              <code>VITE_NAMI_OFFICIAL_OWNER</code> is not set on this deploy.
            </p>
          )}
          {zkMatchesConfigured ? (
            <p className="protocol-hint">Addresses match — owner tools unlock when this wallet is active.</p>
          ) : (
            <p className="onboarding-field-error">
              Addresses do not match. Copy your zkLogin address into{' '}
              <code>VITE_NAMI_OFFICIAL_OWNER</code> in Vercel, redeploy, then hard-refresh. Signup
              email alone does not grant owner access
              {officialEmail ? ' — use Google as ' + officialEmail + '.' : '.'}
            </p>
          )}
        </div>
      ) : null}

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
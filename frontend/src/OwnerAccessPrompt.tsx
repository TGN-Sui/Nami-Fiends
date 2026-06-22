import { type ReactElement } from 'react';

import { readMemberSession } from './member-session-store.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { readOfficialOwner, readOfficialOwnerEmail } from './protocol-env.js';
import { isZkLoginConfigured } from './zklogin.js';
import { useProtocolOwner } from './wallet.js';

function shortenAddress(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return value.slice(0, 10) + '…' + value.slice(-6);
}

export function OwnerAccessPrompt(): ReactElement | null {
  const { owner, source } = useProtocolOwner();
  const officialOwner = readOfficialOwner();
  const officialEmail = readOfficialOwnerEmail();
  const session = readMemberSession();
  const sessionEmail = session?.email?.trim().toLowerCase() ?? null;

  if (!officialEmail) {
    return null;
  }

  if (isOfficialOwner(owner)) {
    return null;
  }

  const emailMatchesOwner = sessionEmail === officialEmail;

  if (!emailMatchesOwner && source !== 'zklogin') {
    return null;
  }

  const envOwnerMissing = officialOwner === null;

  return (
    <article className="panel settings-card settings-compact-card settings-section-wide nami-owner-access-prompt">
      <div className="profile-panel-heading">
        <span className="mini-badge">Owner access</span>
        <h2>Unlock Advanced settings</h2>
        <p>
          Owner tools are gated by your official protocol wallet, not onboarding email alone.
          Sign in with Google using <strong>{officialEmail}</strong> so your zkLogin address
          matches the configured official owner wallet.
        </p>
      </div>

      <ul className="nami-owner-access-checklist">
        <li>
          {isZkLoginConfigured()
            ? 'Google zkLogin is configured for this build.'
            : 'Set VITE_ZKLOGIN_CLIENT_ID and VITE_ZKLOGIN_REDIRECT_URL for this deploy origin.'}
        </li>
        {envOwnerMissing ? (
          <li>
            <code>VITE_NAMI_OFFICIAL_OWNER</code> is missing or still a placeholder in{' '}
            <code>frontend/.env.local</code>. Set it to your zkLogin address — a placeholder in{' '}
            <code>.env.local</code> overrides the value in <code>.env</code>.
          </li>
        ) : (
          <li>
            Official owner wallet: <code>{shortenAddress(officialOwner)}</code>
          </li>
        )}
        <li>
          {owner
            ? 'Connected as ' + shortenAddress(owner) + (source ? ' (' + source + ')' : '') + '.'
            : 'No protocol wallet connected yet.'}
        </li>
        {owner && !isOfficialOwner(owner) ? (
          <li>
            {envOwnerMissing
              ? 'Set VITE_NAMI_OFFICIAL_OWNER in frontend/.env.local to your zkLogin address, then restart the dev server.'
              : source === 'wallet'
                ? 'A browser wallet extension is connected, but it does not match the official owner address. Sign in with Google zkLogin using the owner account, or disconnect the extension wallet.'
                : 'Connected wallet does not match the official owner address. Update VITE_NAMI_OFFICIAL_OWNER to your zkLogin address after signing in, or sign in with the owner Google account that derives this wallet.'}
          </li>
        ) : null}
      </ul>
    </article>
  );
}
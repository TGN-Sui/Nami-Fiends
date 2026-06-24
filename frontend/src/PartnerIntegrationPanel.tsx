import { useEffect, useState, type ReactElement } from 'react';

import { fetchLinkedProfile } from './nami-linked-profile-api.js';
import { fetchNodenameLookup } from './nami-nodename-api.js';
import { useLinkedMemberProfile } from './linked-member-store.js';
import { readIndexerUrl } from './protocol-env.js';
import { useProtocolOwner } from './wallet.js';

function shortenAddress(value: string): string {
  return value.length <= 12 ? value : value.slice(0, 8) + '…' + value.slice(-4);
}

export function PartnerIntegrationPanel(): ReactElement {
  const { owner, source } = useProtocolOwner();
  const linkedProfile = useLinkedMemberProfile();
  const [lookupHandle, setLookupHandle] = useState('');
  const [lookupResult, setLookupResult] = useState<Awaited<ReturnType<typeof fetchNodenameLookup>>>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const apiBase = readIndexerUrl();

  useEffect(() => {
    if (!owner?.startsWith('0x')) {
      return;
    }

    void fetchLinkedProfile(owner).catch(() => undefined);
  }, [owner]);

  async function handleLookup(): Promise<void> {
    setLookupError(null);
    setLookupPending(true);

    try {
      const result = await fetchNodenameLookup(lookupHandle, { includeLinkedProfile: true });
      setLookupResult(result);

      if (!result) {
        setLookupError('No indexed nodename found for that handle.');
      }
    } catch (error) {
      setLookupResult(null);
      setLookupError(error instanceof Error ? error.message : 'Lookup failed.');
    } finally {
      setLookupPending(false);
    }
  }

  const proofStatus = linkedProfile?.proof.status ?? 'not_connected';
  const nodename = linkedProfile?.anchor.nodename ?? null;

  return (
    <article className="panel settings-card partner-integration-panel">
      <div className="profile-panel-heading">
        <h2>Cross-platform passport</h2>
        <p>
          Partner platforms use your zkLogin or wallet address to verify passport ownership and hydrate
          linked Nami data — no second claim required.
        </p>
      </div>

      <div className="passport-proof-grid partner-integration-status-grid">
        <div className="passport-proof-card">
          <span className="mini-badge">Sign-in</span>
          <strong>{owner ? shortenAddress(owner) : 'Not connected'}</strong>
          <p>{source ? `Source: ${source}` : 'Connect zkLogin or wallet to prove identity.'}</p>
        </div>
        <div className="passport-proof-card">
          <span className="mini-badge">Passport proof</span>
          <strong>{proofStatus === 'verified' ? 'Verified' : 'Pending'}</strong>
          <p>
            {proofStatus === 'verified'
              ? 'Identity and passport objects are owned and linked at this address.'
              : 'Mint enter_nami or sync after claim approval.'}
          </p>
        </div>
        <div className="passport-proof-card">
          <span className="mini-badge">Nodename</span>
          <strong>{nodename ?? '—'}</strong>
          <p>{nodename ? 'Immutable on-chain handle for partner lookups.' : 'Not minted yet.'}</p>
        </div>
      </div>

      {apiBase ? (
        <p className="protocol-hint">
          Nami API: <code>{apiBase}</code>
        </p>
      ) : (
        <p className="protocol-hint">Set VITE_NAMI_INDEXER_URL to exercise live partner API calls.</p>
      )}

      <div className="partner-integration-lookup">
        <label className="onboarding-field">
          <span>Lookup nodename (partner demo)</span>
          <input
            onChange={(event) => setLookupHandle(event.target.value)}
            placeholder="fiendgamer"
            value={lookupHandle}
          />
        </label>
        <button
          className="secondary-action"
          disabled={lookupPending || lookupHandle.trim().length < 8}
          onClick={() => void handleLookup()}
          type="button"
        >
          {lookupPending ? 'Looking up…' : 'Resolve handle'}
        </button>
        {lookupError ? <p className="protocol-hint">{lookupError}</p> : null}
        {lookupResult ? (
          <pre className="partner-integration-result">{JSON.stringify(lookupResult, null, 2)}</pre>
        ) : null}
      </div>

      <details className="partner-integration-snippet">
        <summary>Integrator snippet</summary>
        <pre>{`import { resolveNamiMemberFromWallet, isVerifiedNamiMember } from '@nami/sdk/partner';

const member = await resolveNamiMemberFromWallet(chain, indexer, zkLoginAddress);
if (isVerifiedNamiMember(member)) {
  // Portable identity — hydrate UI from member.anchor + linked profile API
}`}</pre>
      </details>
    </article>
  );
}
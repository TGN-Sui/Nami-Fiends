import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { getProtocolContext } from './protocol.js';
import {
  fetchSealPrivacyStatus,
  listSealedEvidence,
  openSealedEvidence,
  sealEvidencePacket,
  SEAL_EVIDENCE_POLICIES,
  sealPrivacyErrorMessage,
  SealPrivacyApiError,
  type SealEvidencePolicy,
  type SealedEvidenceRef,
  type SealPrivacyStatus,
} from './seal-privacy-api.js';
import { useProtocolOwner } from './wallet.js';

const POLICY_LABELS: Record<SealEvidencePolicy, string> = {
  appeal_evidence: 'Appeal evidence',
  moderation_packet: 'Moderation packet',
  recovery_attachment: 'Recovery attachment',
  verification_proof: 'Verification proof',
};

export function SealPrivacyEvidencePanel(): ReactElement {
  const context = useMemo(() => getProtocolContext(), []);
  const { owner } = useProtocolOwner();
  const official = isOfficialOwner(owner);

  const [status, setStatus] = useState<SealPrivacyStatus | null>(null);
  const [items, setItems] = useState<SealedEvidenceRef[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openedPlaintext, setOpenedPlaintext] = useState<string | null>(null);
  const [policy, setPolicy] = useState<SealEvidencePolicy>('appeal_evidence');
  const [relatedId, setRelatedId] = useState('');
  const [draftPlaintext, setDraftPlaintext] = useState('');
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [actionState, setActionState] = useState<'idle' | 'working'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectablePolicies = useMemo(
    () =>
      official
        ? SEAL_EVIDENCE_POLICIES
        : SEAL_EVIDENCE_POLICIES.filter((entry) => entry !== 'moderation_packet'),
    [official]
  );

  useEffect(() => {
    if (!context.indexer) {
      setLoadState('ready');
      return;
    }

    let cancelled = false;

    setLoadState('loading');
    setErrorMessage(null);

    void fetchSealPrivacyStatus()
      .then((nextStatus) => {
        if (cancelled) {
          return null;
        }

        setStatus(nextStatus);
        return nextStatus;
      })
      .then(async (nextStatus) => {
        if (cancelled || !owner || !nextStatus?.enabled) {
          return;
        }

        const nextItems = await listSealedEvidence(owner);

        if (!cancelled) {
          setItems(nextItems);
          setLoadState('ready');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setLoadState('error');
        setErrorMessage(
          error instanceof SealPrivacyApiError
            ? sealPrivacyErrorMessage(error.code)
            : error instanceof Error
              ? error.message
              : 'Could not load Seal privacy lane.'
        );
      });

    return () => {
      cancelled = true;
    };
  }, [context.indexer, owner]);

  async function refreshList(): Promise<void> {
    if (!owner || !status?.enabled) {
      return;
    }

    const nextItems = await listSealedEvidence(owner);
    setItems(nextItems);
  }

  async function handleSealEvidence(): Promise<void> {
    if (!owner) {
      return;
    }

    setActionState('working');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const sealed = await sealEvidencePacket({
        owner,
        policy,
        plaintext: draftPlaintext,
        relatedId: relatedId.trim() || null,
      });

      setDraftPlaintext('');
      setRelatedId('');
      setSelectedId(sealed.id);
      setOpenedPlaintext(null);
      setSuccessMessage(`Sealed evidence ${sealed.id}. Use this id as the on-chain public_reference.`);
      await refreshList();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof SealPrivacyApiError
          ? sealPrivacyErrorMessage(error.code)
          : error instanceof Error
            ? error.message
            : 'Could not seal evidence.'
      );
    } finally {
      setActionState('idle');
    }
  }

  async function handleOpenEvidence(evidenceId: string): Promise<void> {
    if (!owner) {
      return;
    }

    setActionState('working');
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedId(evidenceId);

    try {
      const opened = await openSealedEvidence({ owner, evidenceId });
      setOpenedPlaintext(opened.plaintext);
    } catch (error: unknown) {
      setOpenedPlaintext(null);
      setErrorMessage(
        error instanceof SealPrivacyApiError
          ? sealPrivacyErrorMessage(error.code)
          : error instanceof Error
            ? error.message
            : 'Could not open sealed evidence.'
      );
    } finally {
      setActionState('idle');
    }
  }

  return (
    <ProtocolPanelShell
      context={context}
      description="Encrypt appeal, recovery, and moderation evidence off-chain. Officials and subjects decrypt within policy."
      owner={owner}
      requiresIndexer
      title="Seal Privacy Evidence"
    >
      {loadState === 'loading' ? <p className="protocol-hint">Loading Seal privacy lane…</p> : null}
      {loadState === 'error' ? <p className="protocol-hint">{errorMessage}</p> : null}

      {status ? (
        <ul className="protocol-timeline-list">
          <li className="protocol-timeline-item">
            Lane enabled <strong>{status.enabled ? 'yes' : 'no'}</strong>
          </li>
          <li className="protocol-timeline-item">
            Stack <strong>{status.seal_version}</strong>
          </li>
          <li className="protocol-timeline-item">
            Migration <strong>{status.migration_stage}</strong>
          </li>
        </ul>
      ) : null}

      {!status?.enabled && loadState === 'ready' ? (
        <p className="protocol-hint">
          Seal privacy is disabled on the receiving server. Enable `NAMI_SEAL_PRIVACY_ENABLED` and set
          `NAMI_SEAL_EVIDENCE_KEY` in Launch Ops before sealing appeal evidence.
        </p>
      ) : null}

      {status?.enabled ? (
        <>
          <section className="protocol-moderation-grid">
            <div>
              <h3>Seal new evidence</h3>
              <p className="protocol-hint">
                Store sensitive context off-chain, then paste the returned <code>seal-…</code> id into
                AppealCase or Recovery <code>public_reference</code>.
              </p>

              <label className="protocol-field">
                <span>Policy</span>
                <select
                  onChange={(event) => setPolicy(event.target.value as SealEvidencePolicy)}
                  value={policy}
                >
                  {selectablePolicies.map((entry) => (
                    <option key={entry} value={entry}>
                      {POLICY_LABELS[entry]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="protocol-field">
                <span>Related id (optional)</span>
                <input
                  onChange={(event) => setRelatedId(event.target.value)}
                  placeholder="0x appeal / recovery / moderation id"
                  value={relatedId}
                />
              </label>

              <label className="protocol-field">
                <span>Evidence text</span>
                <textarea
                  onChange={(event) => setDraftPlaintext(event.target.value)}
                  placeholder="Describe context, links, or paste a summary hash — never public PII in on-chain fields."
                  rows={5}
                  value={draftPlaintext}
                />
              </label>

              <button
                disabled={actionState === 'working' || draftPlaintext.trim().length === 0}
                onClick={() => void handleSealEvidence()}
                type="button"
              >
                Seal evidence
              </button>
            </div>

            <div>
              <h3>
                {official ? 'All sealed packets' : 'Your sealed packets'} ({items.length})
              </h3>

              {items.length === 0 ? (
                <p className="protocol-hint">No sealed evidence yet.</p>
              ) : (
                <ul className="protocol-timeline-list">
                  {items.map((item) => (
                    <li className="protocol-timeline-item" key={item.id}>
                      <strong>{item.id}</strong>
                      <p>
                        {POLICY_LABELS[item.policy]}
                        {item.related_id ? ` · related ${item.related_id.slice(0, 10)}…` : ''}
                      </p>
                      <button
                        disabled={actionState === 'working'}
                        onClick={() => void handleOpenEvidence(item.id)}
                        type="button"
                      >
                        Open / decrypt
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {successMessage ? <p className="protocol-hint">{successMessage}</p> : null}
          {errorMessage && loadState === 'ready' ? <p className="protocol-hint">{errorMessage}</p> : null}

          {selectedId && openedPlaintext !== null ? (
            <section>
              <h3>Opened evidence ({selectedId})</h3>
              <pre className="protocol-evidence-plaintext">{openedPlaintext}</pre>
            </section>
          ) : null}
        </>
      ) : null}
    </ProtocolPanelShell>
  );
}
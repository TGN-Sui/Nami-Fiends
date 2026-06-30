import { useState, type ReactElement } from 'react';

import { sealedEvidenceForAppeal } from './appeal-seal-evidence.js';
import { isOfficialOwner } from './nami-capabilities.js';
import {
  openSealedEvidence,
  sealEvidencePacket,
  sealPrivacyErrorMessage,
  SealPrivacyApiError,
  type SealedEvidenceRef,
} from './seal-privacy-api.js';
import { useProtocolOwner } from './wallet.js';

type AppealSealEvidenceActionsProps = {
  appealId: string;
  appellant: string;
  evidenceItems: SealedEvidenceRef[];
  sealEnabled: boolean;
  onEvidenceChanged?: () => void | Promise<void>;
};

export function AppealSealEvidenceActions(props: AppealSealEvidenceActionsProps): ReactElement {
  const { owner } = useProtocolOwner();
  const [expanded, setExpanded] = useState(false);
  const [draftPlaintext, setDraftPlaintext] = useState('');
  const [openedPlaintext, setOpenedPlaintext] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const linkedEvidence = sealedEvidenceForAppeal(props.evidenceItems, props.appealId);
  const official = isOfficialOwner(owner);
  const isAppellant =
    Boolean(owner && props.appellant) &&
    owner.toLowerCase() === props.appellant.toLowerCase();
  const canSeal =
    props.sealEnabled &&
    Boolean(owner?.startsWith('0x')) &&
    (official || isAppellant);

  async function handleSeal(): Promise<void> {
    if (!owner || !draftPlaintext.trim()) {
      return;
    }

    setWorking(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      const sealed = await sealEvidencePacket({
        owner,
        policy: 'appeal_evidence',
        plaintext: draftPlaintext.trim(),
        relatedId: props.appealId,
      });

      setDraftPlaintext('');
      setSelectedEvidenceId(sealed.id);
      setOpenedPlaintext(null);
      setMessage('Sealed ' + sealed.id + ' — paste into AppealCase public_reference.');
      await props.onEvidenceChanged?.();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof SealPrivacyApiError
          ? sealPrivacyErrorMessage(error.code)
          : error instanceof Error
            ? error.message
            : 'Could not seal appeal evidence.'
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleOpen(evidenceId: string): Promise<void> {
    if (!owner) {
      return;
    }

    setWorking(true);
    setErrorMessage(null);
    setMessage(null);
    setSelectedEvidenceId(evidenceId);

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
      setWorking(false);
    }
  }

  return (
    <div className="appeal-seal-evidence-actions">
      <div className="appeal-seal-evidence-actions-row">
        <span className="appeal-seal-evidence-count">
          {linkedEvidence.length} sealed packet{linkedEvidence.length === 1 ? '' : 's'}
        </span>
        <button
          className="profile-secondary-link"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          {expanded ? 'Hide evidence' : 'Appeal evidence'}
        </button>
      </div>

      {expanded ? (
        <div className="appeal-seal-evidence-panel">
          {!props.sealEnabled ? (
            <p className="protocol-hint">
              Seal privacy is disabled on the receiving server. Enable it in Launch Ops before
              attaching appeal evidence.
            </p>
          ) : null}

          {linkedEvidence.length === 0 ? (
            <p className="protocol-hint">No sealed appeal evidence linked to this appeal yet.</p>
          ) : (
            <ul className="protocol-timeline-list appeal-seal-evidence-list">
              {linkedEvidence.map((item) => (
                <li className="protocol-timeline-item" key={item.id}>
                  <strong>{item.id}</strong>
                  <button
                    className="profile-secondary-link"
                    disabled={working}
                    onClick={() => void handleOpen(item.id)}
                    type="button"
                  >
                    Decrypt
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedEvidenceId && openedPlaintext ? (
            <pre className="appeal-seal-evidence-plaintext">{openedPlaintext}</pre>
          ) : null}

          {canSeal ? (
            <label className="appeal-seal-evidence-compose">
              <span>Seal appeal context for {props.appealId.slice(0, 12)}…</span>
              <textarea
                onChange={(event) => setDraftPlaintext(event.target.value)}
                placeholder="Private appeal notes, screenshots summary, or moderator context…"
                rows={4}
                value={draftPlaintext}
              />
              <button
                className="nami-surface-button is-primary-surface-button"
                disabled={working || !draftPlaintext.trim()}
                onClick={() => void handleSeal()}
                type="button"
              >
                {working ? 'Sealing…' : 'Seal appeal evidence'}
              </button>
            </label>
          ) : null}

          {message ? <p className="protocol-hint appeal-seal-evidence-success">{message}</p> : null}
          {errorMessage ? (
            <p className="protocol-hint appeal-seal-evidence-error">{errorMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
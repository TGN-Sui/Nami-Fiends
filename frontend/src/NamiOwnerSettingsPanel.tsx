import { useMemo, useState, type ReactElement } from 'react';

import { readOfficialOwner, readOfficialOwnerEmail } from './protocol-env.js';
import {
  OWNER_CAPABILITY_LABELS,
  canManageModerators,
  canReviewNodenameClaims,
  isOfficialOwner,
  type NamiOwnerCapability,
} from './nami-capabilities.js';
import {
  addOfficialModerator,
  approveAllPendingClaims,
  approvePendingClaims,
  claimPreferredName,
  rejectPendingClaims,
  banMemberTarget,
  readOpenPendingClaims,
  removeOfficialModerator,
  unbanMemberTarget,
  useNamiAdminStore,
} from './nami-admin-store.js';
import { PassportFulfillmentPanel } from './PassportFulfillmentPanel.js';
import { OwnerProvisionedChannelsPanel } from './OwnerProvisionedChannelsPanel.js';
import type { NamiChannel } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

function shortenAddress(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return value.slice(0, 10) + '…' + value.slice(-6);
}

export function NamiOwnerSettingsPanel(props: {
  embedded?: boolean;
  onOpenChannel?: (channel: NamiChannel) => void;
} = {}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const { pendingClaims, openPendingCount, banList, moderators } = useNamiAdminStore();

  const [selectedClaimIds, setSelectedClaimIds] = useState<Set<string>>(new Set());
  const [moderatorInput, setModeratorInput] = useState('');
  const [banTargetKey, setBanTargetKey] = useState('');
  const [banTargetLabel, setBanTargetLabel] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banKind, setBanKind] = useState<'user' | 'moderator'>('user');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const officialOwner = readOfficialOwner();
  const officialOwnerEmail = readOfficialOwnerEmail();
  const canReview = canReviewNodenameClaims(owner);
  const canManageMods = canManageModerators(owner);
  const ownerCapabilities = (Object.keys(OWNER_CAPABILITY_LABELS) as NamiOwnerCapability[]).filter(
    (capability) => isOfficialOwner(owner)
  );

  const openClaims = useMemo(() => {
    return pendingClaims.filter((claim) => claim.status === 'pending');
  }, [pendingClaims]);

  if (!canReview) {
    return null;
  }

  function clearActionMessages(): void {
    setActionNotice(null);
    setActionError(null);
  }

  function toggleClaimSelection(claimId: string): void {
    setSelectedClaimIds((current) => {
      const next = new Set(current);

      if (next.has(claimId)) {
        next.delete(claimId);
      } else {
        next.add(claimId);
      }

      return next;
    });
  }

  function selectAllOpenClaims(): void {
    setSelectedClaimIds(new Set(openClaims.map((claim) => claim.id)));
  }

  function handleApproveSelected(): void {
    clearActionMessages();

    const approved = approvePendingClaims([...selectedClaimIds], owner);

    if (approved === 0) {
      setActionError('Select at least one pending claim to approve.');
      return;
    }

    setActionNotice(approved + ' claim(s) approved.');
    setSelectedClaimIds(new Set());
  }

  function handleApproveAll(): void {
    clearActionMessages();

    const pendingBefore = readOpenPendingClaims().length;
    const approved = approveAllPendingClaims(owner);

    if (approved === 0) {
      setActionError(pendingBefore === 0 ? 'No pending claims to approve.' : 'Could not approve claims.');
      return;
    }

    setActionNotice('Approved all ' + approved + ' pending claim(s).');
    setSelectedClaimIds(new Set());
  }

  function handleDenySelected(): void {
    clearActionMessages();

    const denied = rejectPendingClaims([...selectedClaimIds], owner);

    if (denied === 0) {
      setActionError('Select at least one pending claim to deny.');
      return;
    }

    setActionNotice(denied + ' claim(s) denied.');
    setSelectedClaimIds(new Set());
  }

  function handleAddModerator(): void {
    clearActionMessages();

    if (!canManageMods) {
      setActionError('Only the Nami Official owner can add moderators.');
      return;
    }

    const added = addOfficialModerator(moderatorInput, owner);

    if (!added) {
      setActionError('Could not add moderator. Check the address and try again.');
      return;
    }

    setModeratorInput('');
    setActionNotice('Moderator added.');
  }

  function handleRemoveModerator(address: string): void {
    clearActionMessages();

    if (!canManageMods) {
      setActionError('Only the Nami Official owner can remove moderators.');
      return;
    }

    const removed = removeOfficialModerator(address, owner);

    if (!removed) {
      setActionError('Could not remove moderator.');
      return;
    }

    setActionNotice('Moderator removed.');
  }

  function handleBanTarget(): void {
    clearActionMessages();

    const banned = banMemberTarget(
      {
        targetKey: banTargetKey,
        targetLabel: banTargetLabel,
        reason: banReason,
        kind: banKind,
      },
      owner
    );

    if (!banned) {
      setActionError('Could not ban target. Check the key and your permissions.');
      return;
    }

    setBanTargetKey('');
    setBanTargetLabel('');
    setBanReason('');
    setActionNotice('Target banned / blacklisted.');
  }

  function handleUnban(targetKey: string): void {
    clearActionMessages();

    const unbanned = unbanMemberTarget(targetKey, owner);

    if (!unbanned) {
      setActionError('Could not remove ban entry.');
      return;
    }

    setActionNotice('Ban lifted for ' + shortenAddress(targetKey) + '.');
  }

  return (
    <section
      className={
        'nami-owner-settings panel' + (props.embedded ? ' nami-owner-advanced-embedded-panel' : '')
      }
    >
      {props.embedded ? (
        openPendingCount > 0 ? (
          <div className="nami-owner-advanced-inline-status">
            <span
              className="nami-owner-pending-badge"
              aria-label={'Pending claims: ' + openPendingCount}
            >
              {openPendingCount} pending claims
            </span>
          </div>
        ) : null
      ) : (
        <div className="nami-owner-settings-header">
          <div>
            <span className="mini-badge">Nami Owner Settings</span>
            <h2>Official security console</h2>
            <p>
              Sole-owner console for nodename claims, enforcement, jury control, and moderator
              promotion. Connected as <strong>Official Owner</strong>.
            </p>
          </div>
          {openPendingCount > 0 ? (
            <span
              className="nami-owner-pending-badge"
              aria-label={'Pending claims: ' + openPendingCount}
            >
              {openPendingCount} pending
            </span>
          ) : null}
        </div>
      )}

      <div
        className={props.embedded ? 'nami-owner-advanced-scroll-region nami-owner-settings-body' : 'nami-owner-settings-body'}
      >
      {officialOwner ? (
        <p className="protocol-hint nami-owner-official-wallet">
          Official owner wallet: <code>{shortenAddress(officialOwner)}</code>
          {officialOwnerEmail ? (
            <>
              {' '}
              · Google account: <code>{officialOwnerEmail}</code>
            </>
          ) : null}
        </p>
      ) : null}

      <ul className="nami-owner-capability-list">
        {ownerCapabilities.map((capability) => (
          <li key={capability}>{OWNER_CAPABILITY_LABELS[capability]}</li>
        ))}
      </ul>

      <OwnerProvisionedChannelsPanel
        embedded
        {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
      />

      <article className="nami-owner-section panel">
        <div className="profile-panel-heading">
          <h3>Pending nodename claims</h3>
          <p>Select one or more submissions to approve, or approve everything at once.</p>
        </div>

        {openClaims.length === 0 ? (
          <p className="protocol-hint">No pending claims right now.</p>
        ) : (
          <>
            <div className="nami-owner-claim-toolbar">
              <button className="profile-secondary-link" onClick={selectAllOpenClaims} type="button">
                Select all
              </button>
              <button
                className="profile-secondary-link"
                disabled={selectedClaimIds.size === 0}
                onClick={handleApproveSelected}
                type="button"
              >
                Approve selected ({selectedClaimIds.size})
              </button>
              <button className="onboarding-primary-btn" onClick={handleApproveAll} type="button">
                Approve all
              </button>
              <button
                className="profile-secondary-link"
                disabled={selectedClaimIds.size === 0}
                onClick={handleDenySelected}
                type="button"
              >
                Deny selected ({selectedClaimIds.size})
              </button>
            </div>

            <ul className="nami-owner-claim-list">
              {openClaims.map((claim) => (
                <li className="nami-owner-claim-row" key={claim.id}>
                  <label className="nami-owner-claim-checkbox">
                    <input
                      checked={selectedClaimIds.has(claim.id)}
                      onChange={() => toggleClaimSelection(claim.id)}
                      type="checkbox"
                    />
                    <span className="nami-owner-claim-summary">
                      <strong>{claimPreferredName(claim)}</strong>
                      <span>
                        @{claim.nodename} · {claim.email}
                      </span>
                      <span>{claim.displayName}</span>
                      <span>
                        {claim.archetypeLabel} · {claim.method}
                        {claim.submitterAddress ? ' · ' + shortenAddress(claim.submitterAddress) : ''}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>

      <PassportFulfillmentPanel />

      <article className="nami-owner-section panel">
        <div className="profile-panel-heading">
          <h3>Official moderators</h3>
          <p>
            {canManageMods
              ? 'Only the AdminCap owner can add or remove official moderators.'
              : 'Moderators cannot add or remove other moderators.'}
          </p>
        </div>

        {moderators.length === 0 ? (
          <p className="protocol-hint">No official moderators yet.</p>
        ) : (
          <ul className="nami-owner-moderator-list">
            {moderators.map((address) => (
              <li className="nami-owner-moderator-row" key={address}>
                <code>{shortenAddress(address)}</code>
                {canManageMods ? (
                  <button
                    className="profile-secondary-link"
                    onClick={() => handleRemoveModerator(address)}
                    type="button"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canManageMods ? (
          <div className="nami-owner-moderator-form">
            <label className="onboarding-field">
              <span>Moderator wallet address</span>
              <input
                onChange={(event) => setModeratorInput(event.target.value)}
                placeholder="0x…"
                type="text"
                value={moderatorInput}
              />
            </label>
            <button className="onboarding-primary-btn" onClick={handleAddModerator} type="button">
              Add moderator
            </button>
          </div>
        ) : null}
      </article>

      <article className="nami-owner-section panel">
        <div className="profile-panel-heading">
          <h3>Ban / blacklist enforcement</h3>
          <p>Manually block a user or moderator by wallet address, email, or nodename key.</p>
        </div>

        <div className="nami-owner-ban-form">
          <label className="onboarding-field">
            <span>Target key</span>
            <input
              onChange={(event) => setBanTargetKey(event.target.value)}
              placeholder="0x…, email, or @nodename"
              type="text"
              value={banTargetKey}
            />
          </label>
          <label className="onboarding-field">
            <span>Display label</span>
            <input
              onChange={(event) => setBanTargetLabel(event.target.value)}
              placeholder="Optional friendly label"
              type="text"
              value={banTargetLabel}
            />
          </label>
          <label className="onboarding-field">
            <span>Reason</span>
            <input
              onChange={(event) => setBanReason(event.target.value)}
              placeholder="Policy violation details"
              type="text"
              value={banReason}
            />
          </label>
          <label className="onboarding-field">
            <span>Kind</span>
            <select onChange={(event) => setBanKind(event.target.value as 'user' | 'moderator')} value={banKind}>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
            </select>
          </label>
          <button className="onboarding-primary-btn" onClick={handleBanTarget} type="button">
            Ban / blacklist
          </button>
        </div>

        {banList.length === 0 ? (
          <p className="protocol-hint">No active bans.</p>
        ) : (
          <ul className="nami-owner-ban-list">
            {banList.map((entry) => (
              <li className="nami-owner-ban-row" key={entry.id}>
                <div>
                  <strong>{entry.targetLabel}</strong>
                  <span>
                    {entry.kind} · {entry.targetKey}
                  </span>
                  <span>{entry.reason}</span>
                </div>
                <button
                  className="profile-secondary-link"
                  onClick={() => handleUnban(entry.targetKey)}
                  type="button"
                >
                  Lift ban
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>

      {actionError ? <p className="onboarding-field-error">{actionError}</p> : null}
      {actionNotice ? <p className="protocol-hint nami-owner-action-notice">{actionNotice}</p> : null}
      </div>
    </section>
  );
}
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';

import {
  createEmptyGameOnboardingDraft,
  isGameIdentityStepReady,
  isGameOfficialsStepReady,
  isGameSubmissionReady,
  type GameOnboardingDraft,
} from './game-onboarding-draft.js';
import { syncGameOwnerSessionFromTicket } from './game-owner-session-store.js';
import {
  buildOfficialGameSubmissionTicket,
  upsertGameSubmissionTicket,
  type GameSubmissionTicket,
} from './game-submission-ticket-store.js';
import { GAME_STORE_LINK_FIELDS } from './game-genres.js';
import { buildGameTicketPreviewFields } from './game-ticket-preview.js';
import { computeGameTrustScoreFromDraft } from './game-trust-score.js';
import { ContactCodeVerificationControl } from './ContactCodeVerificationControl.js';
import { GameOfficialSocialAuthControl } from './GameOfficialSocialAuthControl.js';
import { isContactVerified } from './contact-code-verification-store.js';
import {
  clearGameOfficialSocialAuth,
  readGameOfficialSocialAuthState,
  useGameOfficialSocialAuthState,
} from './game-official-social-auth-store.js';
import { GameTrustScorePanel } from './GameTrustScorePanel.js';
import {
  listClaimableOwnerProvisionedChannels,
  markOwnerProvisionedChannelClaimPending,
  ownerProvisionedChannelById,
  useOwnerProvisionedChannels,
} from './owner-provisioned-channels-store.js';
import { resolveTrustWalletSource } from './wallet-source.js';
import { ZkLoginConnectControl, useProtocolOwner } from './wallet.js';

type ClaimAct = 'select-channel' | 'identity' | 'officials' | 'proof' | 'review';

const CLAIM_ACTS: Array<{ act: ClaimAct; label: string }> = [
  { act: 'select-channel', label: 'Channel' },
  { act: 'identity', label: 'Identity' },
  { act: 'officials', label: 'Official accounts' },
  { act: 'proof', label: 'Ownership proof' },
  { act: 'review', label: 'Submit claim' },
];

function getActIndex(act: ClaimAct): number {
  return CLAIM_ACTS.findIndex((step) => step.act === act);
}

export function GameChannelClaimPanel(props: {
  onBack?: () => void;
}): ReactElement {
  const { owner, source } = useProtocolOwner();
  const provisionedChannels = useOwnerProvisionedChannels();
  const officialSocialAuth = useGameOfficialSocialAuthState();
  const [act, setAct] = useState<ClaimAct>('select-channel');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GameOnboardingDraft>(() => createEmptyGameOnboardingDraft());
  const [claimProofNotes, setClaimProofNotes] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<GameSubmissionTicket | null>(null);

  const actIndex = getActIndex(act);
  const walletLinked = draft.walletLinked || owner !== null;
  const walletAddress = draft.walletAddress ?? owner;

  const claimableChannels = useMemo(
    () => listClaimableOwnerProvisionedChannels(),
    [provisionedChannels]
  );

  const selectedChannel = selectedChannelId
    ? ownerProvisionedChannelById(selectedChannelId)
    : undefined;

  const trustBreakdown = computeGameTrustScoreFromDraft({
    gameTitle: selectedChannel?.gameTitle ?? draft.gameTitle,
    studioName: draft.studioName,
    contactName: draft.contactName,
    email: draft.email,
    emailVerified: draft.emailVerified,
    phone: draft.phone,
    phoneVerified: draft.phoneVerified,
    websiteUrl: draft.websiteUrl,
    genres: selectedChannel ? [selectedChannel.genre] : draft.genres,
    steamStoreUrl: draft.steamStoreUrl,
    epicStoreUrl: draft.epicStoreUrl,
    xboxStoreUrl: draft.xboxStoreUrl,
    playstationStoreUrl: draft.playstationStoreUrl,
    otherStoreUrl: draft.otherStoreUrl,
    trailerUrl: draft.trailerUrl,
    officialSocialPlatform: draft.officialSocialPlatform,
    officialSocialHandle: draft.officialSocialHandle,
    officialSocialVerified: draft.officialSocialVerified,
    walletLinked,
    walletSource: resolveTrustWalletSource(source, walletLinked),
  });

  const ticketPreviewFields = useMemo(
    () =>
      buildGameTicketPreviewFields({
        gameTitle: selectedChannel?.gameTitle ?? draft.gameTitle,
        studioName: draft.studioName,
        contactName: draft.contactName,
        email: draft.email,
        genres: selectedChannel ? [selectedChannel.genre] : draft.genres,
        platforms: selectedChannel?.platforms ?? draft.platforms,
        websiteUrl: draft.websiteUrl,
        trailerUrl: draft.trailerUrl,
        steamStoreUrl: draft.steamStoreUrl,
        epicStoreUrl: draft.epicStoreUrl,
        xboxStoreUrl: draft.xboxStoreUrl,
        playstationStoreUrl: draft.playstationStoreUrl,
        otherStoreUrl: draft.otherStoreUrl,
        officialSocialPlatform: draft.officialSocialPlatform,
        officialSocialHandle: draft.officialSocialHandle,
        officialSocialVerified: draft.officialSocialVerified,
      }),
    [draft, selectedChannel]
  );

  useEffect(() => {
    const emailVerified = isContactVerified('email', draft.email);
    const phoneVerified = isContactVerified('phone', draft.phone);

    if (emailVerified === draft.emailVerified && phoneVerified === draft.phoneVerified) {
      return;
    }

    setDraft((current) => ({
      ...current,
      emailVerified,
      phoneVerified,
    }));
  }, [draft.email, draft.phone, draft.emailVerified, draft.phoneVerified]);

  useEffect(() => {
    if (!draft.officialSocialPlatform) {
      return;
    }

    if (
      officialSocialAuth.platform === draft.officialSocialPlatform &&
      officialSocialAuth.verified &&
      officialSocialAuth.handle
    ) {
      setDraft((current) => {
        if (
          current.officialSocialVerified &&
          current.officialSocialHandle === officialSocialAuth.handle
        ) {
          return current;
        }

        return {
          ...current,
          officialSocialHandle: officialSocialAuth.handle ?? '',
          officialSocialVerified: true,
        };
      });
      return;
    }

    if (draft.officialSocialVerified || draft.officialSocialHandle.trim() !== '') {
      setDraft((current) => ({
        ...current,
        officialSocialHandle: '',
        officialSocialVerified: false,
      }));
    }
  }, [
    draft.officialSocialPlatform,
    draft.officialSocialHandle,
    draft.officialSocialVerified,
    officialSocialAuth.handle,
    officialSocialAuth.platform,
    officialSocialAuth.verified,
  ]);

  const updateDraft = useCallback((patch: Partial<GameOnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  function handleOfficialPlatformChange(platform: 'x' | 'twitch'): void {
    const currentAuth = readGameOfficialSocialAuthState();

    if (currentAuth.platform !== platform) {
      clearGameOfficialSocialAuth();
    }

    updateDraft({
      officialSocialPlatform: platform,
      officialSocialHandle: '',
      officialSocialVerified: false,
    });
  }

  function handleSelectChannel(channelId: string): void {
    setSelectedChannelId(channelId);
    const channel = ownerProvisionedChannelById(channelId);

    if (channel) {
      updateDraft({
        gameTitle: channel.gameTitle,
        genres: [channel.genre],
        platforms: channel.platforms,
      });
    }
  }

  function handleSubmitClaim(): void {
    setSubmitError(null);

    if (!selectedChannel) {
      setSubmitError('Select a claimable channel first.');
      return;
    }

    if (!isGameSubmissionReady({ ...draft, walletLinked, walletAddress })) {
      setSubmitError(
        'Complete identity, official social authorization, and zkLogin sign-in before submitting.'
      );
      return;
    }

    if (!draft.officialSocialPlatform) {
      setSubmitError('Choose an official X or Twitch account.');
      return;
    }

    if (claimProofNotes.trim().length < 12) {
      setSubmitError('Describe your ownership proof in at least 12 characters.');
      return;
    }

    const ticketId = 'channel-claim-' + Date.now().toString(36);

    const ticket = buildOfficialGameSubmissionTicket({
      id: ticketId,
      ticketKind: 'channel-claim',
      gameTitle: selectedChannel.gameTitle,
      studioName: draft.studioName.trim(),
      contactName: draft.contactName.trim(),
      email: draft.email.trim().toLowerCase(),
      genres: [selectedChannel.genre],
      platforms: selectedChannel.platforms,
      websiteUrl: draft.websiteUrl.trim(),
      steamStoreUrl: draft.steamStoreUrl.trim(),
      epicStoreUrl: draft.epicStoreUrl.trim(),
      xboxStoreUrl: draft.xboxStoreUrl.trim(),
      playstationStoreUrl: draft.playstationStoreUrl.trim(),
      otherStoreUrl: draft.otherStoreUrl.trim(),
      trailerUrl: draft.trailerUrl.trim(),
      officialSocialPlatform: draft.officialSocialPlatform,
      officialSocialHandle: draft.officialSocialHandle.trim(),
      officialSocialVerified: draft.officialSocialVerified,
      walletAddress,
      provisionalChannelId: selectedChannel.channelId,
      targetChannelId: selectedChannel.channelId,
      claimProofNotes: claimProofNotes.trim(),
      trustScore: trustBreakdown.total,
      trustScoreTier: trustBreakdown.tier,
      status: 'submitted',
      questionnaireEligible: false,
      questionnaireStarted: false,
      submittedAtMs: Date.now(),
    });

    const marked = markOwnerProvisionedChannelClaimPending(selectedChannel.channelId, ticketId);

    if (!marked) {
      setSubmitError('That channel is no longer available to claim.');
      return;
    }

    upsertGameSubmissionTicket(ticket);
    syncGameOwnerSessionFromTicket(ticket.id);
    setSubmittedTicket(ticket);
    setAct('review');
  }

  const proofStepReady =
    claimProofNotes.trim().length >= 12 ||
    draft.websiteUrl.trim() !== '' ||
    draft.steamStoreUrl.trim() !== '' ||
    draft.trailerUrl.trim() !== '';

  return (
    <section className="game-onboarding-panel game-channel-claim-panel">
      <div className="onboarding-copy">
        <p className="eyebrow">Channel claim</p>
        <h2>Claim an owner-provisioned game channel</h2>
        <p>
          Prove you own the game tied to a reserved Nami channel. The official owner reviews your
          claim ticket before channel keys hand over — you cannot enter as channel owner until
          approved.
        </p>
      </div>

      <GameTrustScorePanel compact draft={draft} showSuggestions />

      <div className="onboarding-card panel">
        <div className="onboarding-act-rail" aria-label="Channel claim progress">
          {CLAIM_ACTS.map((step, index) => (
            <button
              className={
                'onboarding-act-pill' +
                (index === actIndex ? ' is-active' : '') +
                (index < actIndex ? ' is-done' : '')
              }
              key={step.act}
              onClick={() => setAct(step.act)}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </button>
          ))}
        </div>

        {act === 'select-channel' ? (
          <div className="onboarding-step-body">
            {claimableChannels.length === 0 ? (
              <p className="protocol-hint">
                No claimable channels right now. Ask Nami Officials if your game already has a
                reserved channel, or submit a new game ticket instead.
              </p>
            ) : (
              <ul className="nami-owner-claim-list game-channel-claim-picker">
                {claimableChannels.map((channel) => (
                  <li className="nami-owner-claim-row" key={channel.channelId}>
                    <label className="nami-owner-claim-checkbox">
                      <input
                        checked={selectedChannelId === channel.channelId}
                        name="claim-channel"
                        onChange={() => handleSelectChannel(channel.channelId)}
                        type="radio"
                      />
                      <span className="nami-owner-claim-summary">
                        <strong>{channel.gameTitle}</strong>
                        <span>@{channel.handle}</span>
                        <span>
                          {channel.genre} · {channel.platforms.join(', ')}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="onboarding-step-actions">
              <button
                className="onboarding-primary-btn"
                disabled={!selectedChannel}
                onClick={() => setAct('identity')}
                type="button"
              >
                Continue to identity
              </button>
            </div>
          </div>
        ) : null}

        {act === 'identity' ? (
          <div className="onboarding-step-body">
            {selectedChannel ? (
              <p className="protocol-hint">
                Claiming <strong>{selectedChannel.gameTitle}</strong> (@{selectedChannel.handle})
              </p>
            ) : null}
            <label className="onboarding-field">
              <span>Studio / publisher</span>
              <input
                onChange={(event) => updateDraft({ studioName: event.target.value })}
                placeholder="Studio legal or public name"
                type="text"
                value={draft.studioName}
              />
            </label>
            <label className="onboarding-field">
              <span>Primary contact</span>
              <input
                onChange={(event) => updateDraft({ contactName: event.target.value })}
                placeholder="Full name"
                type="text"
                value={draft.contactName}
              />
            </label>
            <ContactCodeVerificationControl
              autoComplete="email"
              channel="email"
              inputType="email"
              label="Business email (optional)"
              onChange={(email) => updateDraft({ email })}
              onVerifiedChange={(emailVerified) => updateDraft({ emailVerified })}
              optionalHint="Leave blank to skip email Trust Score. If you enter an address, verify it with a code before continuing."
              placeholder="studio@example.com"
              value={draft.email}
              verified={draft.emailVerified}
            />
            <ContactCodeVerificationControl
              autoComplete="tel"
              channel="phone"
              inputType="tel"
              label="Phone number (optional)"
              onChange={(phone) => updateDraft({ phone })}
              onVerifiedChange={(phoneVerified) => updateDraft({ phoneVerified })}
              optionalHint="Leave blank to skip phone Trust Score. If you enter a number, verify it with a code before continuing."
              placeholder="+1 555 0100"
              value={draft.phone}
              verified={draft.phoneVerified}
            />
            <div className="onboarding-step-actions">
              <button
                className="onboarding-secondary-btn"
                onClick={() => setAct('select-channel')}
                type="button"
              >
                Back
              </button>
              <button
                className="onboarding-primary-btn"
                disabled={!isGameIdentityStepReady({ ...draft, gameTitle: selectedChannel?.gameTitle ?? draft.gameTitle })}
                onClick={() => setAct('officials')}
                type="button"
              >
                Continue to official accounts
              </button>
            </div>
          </div>
        ) : null}

        {act === 'officials' ? (
          <div className="onboarding-step-body">
            <fieldset className="onboarding-quiz-question">
              <legend>Official game account platform</legend>
              <p className="protocol-hint">
                Authorize the official {draft.officialSocialPlatform === 'twitch' ? 'Twitch' : 'X'}{' '}
                account that proves you represent this game.
              </p>
              <div className="onboarding-quiz-options">
                <label className="onboarding-quiz-option">
                  <input
                    checked={draft.officialSocialPlatform === 'x'}
                    name="claim-official-social-platform"
                    onChange={() => handleOfficialPlatformChange('x')}
                    type="radio"
                  />
                  <span>X (official game account)</span>
                </label>
                <label className="onboarding-quiz-option">
                  <input
                    checked={draft.officialSocialPlatform === 'twitch'}
                    name="claim-official-social-platform"
                    onChange={() => handleOfficialPlatformChange('twitch')}
                    type="radio"
                  />
                  <span>Twitch (official channel)</span>
                </label>
              </div>
            </fieldset>

            {draft.officialSocialPlatform ? (
              <GameOfficialSocialAuthControl
                gameTitle={selectedChannel?.gameTitle ?? draft.gameTitle}
                platform={draft.officialSocialPlatform}
              />
            ) : (
              <p className="protocol-hint">Select X or Twitch to open the official sign-in authorizer.</p>
            )}

            <div className="onboarding-zklogin-block">
              <div className="onboarding-zklogin-copy">
                <span className="nami-entry-login-label">Sui wallet via zkLogin</span>
                <p className="nami-entry-login-method-desc">
                  Link Google sign-in so Nami Officials can verify your Sui account.
                </p>
              </div>
              <ZkLoginConnectControl />
            </div>

            <div className="onboarding-step-actions">
              <button className="onboarding-secondary-btn" onClick={() => setAct('identity')} type="button">
                Back
              </button>
              <button
                className="onboarding-primary-btn"
                disabled={!isGameOfficialsStepReady({ ...draft, walletLinked, walletAddress })}
                onClick={() => setAct('proof')}
                type="button"
              >
                Continue to ownership proof
              </button>
            </div>
          </div>
        ) : null}

        {act === 'proof' ? (
          <div className="onboarding-step-body">
            <label className="onboarding-field">
              <span>Ownership proof notes (required)</span>
              <textarea
                onChange={(event) => setClaimProofNotes(event.target.value)}
                placeholder="Explain how you prove ownership: studio role, store listing control, press contact, etc."
                rows={4}
                value={claimProofNotes}
              />
            </label>

            <label className="onboarding-field">
              <span>Official website (optional)</span>
              <input
                onChange={(event) => updateDraft({ websiteUrl: event.target.value })}
                placeholder="https://yourgame.com"
                type="url"
                value={draft.websiteUrl}
              />
            </label>

            {GAME_STORE_LINK_FIELDS.map((storeField) => (
              <label className="onboarding-field" key={storeField.key}>
                <span>{storeField.label} (optional)</span>
                <input
                  onChange={(event) => updateDraft({ [storeField.key]: event.target.value })}
                  placeholder="https://..."
                  type="url"
                  value={draft[storeField.key]}
                />
              </label>
            ))}

            <label className="onboarding-field">
              <span>Trailer URL (optional)</span>
              <input
                onChange={(event) => updateDraft({ trailerUrl: event.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                type="url"
                value={draft.trailerUrl}
              />
            </label>

            <div className="onboarding-step-actions">
              <button className="onboarding-secondary-btn" onClick={() => setAct('officials')} type="button">
                Back
              </button>
              <button
                className="onboarding-primary-btn"
                disabled={!proofStepReady}
                onClick={() => setAct('review')}
                type="button"
              >
                Review claim ticket
              </button>
            </div>
          </div>
        ) : null}

        {act === 'review' ? (
          <div className="onboarding-step-body">
            <article className="onboarding-preview-card">
              <p className="onboarding-preview-status">Channel claim preview</p>
              <h3>{selectedChannel?.gameTitle ?? 'Selected channel'}</h3>
              {ticketPreviewFields.length > 0 ? (
                <dl className="onboarding-preview-details">
                  {ticketPreviewFields.map((field) => (
                    <div className="onboarding-preview-detail-row" key={field.id}>
                      <dt>{field.label}</dt>
                      <dd>
                        {field.href ? (
                          <a href={field.href} rel="noreferrer" target="_blank">
                            {field.value}
                          </a>
                        ) : (
                          field.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {claimProofNotes.trim() ? (
                <p className="protocol-hint">
                  <strong>Proof notes:</strong> {claimProofNotes.trim()}
                </p>
              ) : null}
              <p className="protocol-hint">
                Trust Score {trustBreakdown.total}% · Claim tickets always queue for official owner
                review. Channel keys hand over only after approval.
              </p>
            </article>

            {submittedTicket ? (
              <p className="protocol-hint">
                Claim ticket submitted. Status: <strong>{submittedTicket.status}</strong>. The Nami
                official owner will approve or disapprove before you receive channel keys.
              </p>
            ) : null}

            {submitError ? <p className="onboarding-field-error">{submitError}</p> : null}

            <div className="onboarding-step-actions">
              <button className="onboarding-secondary-btn" onClick={() => setAct('proof')} type="button">
                Back
              </button>
              {!submittedTicket ? (
                <button
                  className="onboarding-primary-btn"
                  disabled={!isGameSubmissionReady({ ...draft, walletLinked, walletAddress })}
                  onClick={handleSubmitClaim}
                  type="button"
                >
                  Submit claim to Nami Officials
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {props.onBack ? (
        <button className="secondary-action entry-back-button" onClick={props.onBack} type="button">
          Back to path selection
        </button>
      ) : null}
    </section>
  );
}
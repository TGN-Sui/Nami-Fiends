import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';

import {
  createEmptyGameOnboardingDraft,
  isGameIdentityStepReady,
  isGameOfficialsStepReady,
  isGameSubmissionReady,
  loadGameOnboardingDraft,
  saveGameOnboardingDraft,
  type GameOnboardingAct,
  type GameOnboardingDraft,
} from './game-onboarding-draft.js';
import { syncGameOwnerSessionFromTicket } from './game-owner-session-store.js';
import {
  buildOfficialGameSubmissionTicket,
  createProvisionalChannelId,
  upsertGameSubmissionTicket,
  type GameSubmissionTicket,
} from './game-submission-ticket-store.js';
import {
  GAME_STUDIO_QUESTIONNAIRE_QUESTIONS,
  isGameStudioQuestionnaireComplete,
} from './game-studio-questionnaire.js';
import { GAME_ONBOARDING_GENRES, GAME_STORE_LINK_FIELDS } from './game-genres.js';
import { SUPPORTED_PLATFORMS } from './platform-genre-options.js';
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
import { saveOwnedGameChannelId } from './channel-owner-access.js';
import { saveUserSurfaceRole } from './surface-preferences.js';
import { ZkLoginConnectControl, useProtocolOwner } from './wallet.js';

const GAME_ONBOARDING_ACTS: Array<{ act: GameOnboardingAct; label: string }> = [
  { act: 'identity', label: 'Identity' },
  { act: 'officials', label: 'Official accounts' },
  { act: 'proof', label: 'Game proof' },
  { act: 'review', label: 'Submit ticket' },
  { act: 'questionnaire', label: 'Questionnaire' },
];

function getActIndex(act: GameOnboardingAct): number {
  return GAME_ONBOARDING_ACTS.findIndex((step) => step.act === act);
}

export function GameOnboardingPanel(props: {
  onEnterPreApprovedChannel: () => void;
  onBack?: () => void;
}): ReactElement {
  const { owner, source } = useProtocolOwner();
  const officialSocialAuth = useGameOfficialSocialAuthState();
  const [act, setAct] = useState<GameOnboardingAct>('identity');
  const [draft, setDraft] = useState<GameOnboardingDraft>(() => {
    return loadGameOnboardingDraft() ?? createEmptyGameOnboardingDraft();
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<GameSubmissionTicket | null>(null);

  const actIndex = getActIndex(act);
  const walletLinked = draft.walletLinked || owner !== null;
  const walletAddress = draft.walletAddress ?? owner;

  const trustBreakdown = computeGameTrustScoreFromDraft({
    gameTitle: draft.gameTitle,
    studioName: draft.studioName,
    contactName: draft.contactName,
    email: draft.email,
    emailVerified: draft.emailVerified,
    phone: draft.phone,
    phoneVerified: draft.phoneVerified,
    websiteUrl: draft.websiteUrl,
    genres: draft.genres,
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
    walletSource: (walletLinked ? (source ?? 'demo') : null) as any,
  });

  const ticketPreviewFields = useMemo(
    () =>
      buildGameTicketPreviewFields({
        gameTitle: draft.gameTitle,
        studioName: draft.studioName,
        contactName: draft.contactName,
        email: draft.email,
        genres: draft.genres,
        platforms: draft.platforms,
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
    [draft],
  );

  useEffect(() => {
    saveGameOnboardingDraft({
      ...draft,
      walletLinked,
      walletAddress,
    });
  }, [draft, walletAddress, walletLinked]);

  useEffect(() => {
    const emailVerified = isContactVerified('email', draft.email);
    const phoneVerified = isContactVerified('phone', draft.phone);

    if (
      emailVerified === draft.emailVerified &&
      phoneVerified === draft.phoneVerified
    ) {
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

  function toggleGenre(genre: string): void {
    setDraft((current) => {
      const selected = current.genres.includes(genre);

      return {
        ...current,
        genres: selected
          ? current.genres.filter((entry) => entry !== genre)
          : [...current.genres, genre],
      };
    });
  }

  function togglePlatform(platform: string): void {
    setDraft((current) => {
      const selected = current.platforms.includes(platform);

      return {
        ...current,
        platforms: selected
          ? current.platforms.filter((entry) => entry !== platform)
          : [...current.platforms, platform],
      };
    });
  }

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

  function handleSubmitTicket(): void {
    setSubmitError(null);

    if (!isGameSubmissionReady(draft)) {
      setSubmitError('Complete identity, official social authorization, and zkLogin sign-in before submitting.');
      return;
    }

    if (!draft.officialSocialPlatform) {
      setSubmitError('Choose an official X or Twitch account.');
      return;
    }

    const ticketId = 'game-ticket-' + Date.now().toString(36);
    const provisionalChannelId = createProvisionalChannelId(draft.gameTitle);
    const status = trustBreakdown.preapprovalEligible ? 'preapproved' : 'submitted';

    const ticket = buildOfficialGameSubmissionTicket({
      id: ticketId,
      ticketKind: 'new-game',
      gameTitle: draft.gameTitle.trim(),
      studioName: draft.studioName.trim(),
      contactName: draft.contactName.trim(),
      email: draft.email.trim().toLowerCase(),
      genres: draft.genres,
      platforms: draft.platforms,
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
      provisionalChannelId,
      trustScore: trustBreakdown.total,
      trustScoreTier: trustBreakdown.tier,
      status,
      questionnaireEligible: trustBreakdown.preapprovalEligible,
      questionnaireStarted: false,
      submittedAtMs: Date.now(),
    });

    upsertGameSubmissionTicket(ticket);
    syncGameOwnerSessionFromTicket(ticket.id);
    setSubmittedTicket(ticket);

    if (trustBreakdown.preapprovalEligible) {
      setAct('questionnaire');
      return;
    }

    setAct('review');
  }

  function handleEnterPreApprovedChannel(): void {
    if (!submittedTicket && !trustBreakdown.preapprovalEligible) {
      return;
    }

    const ticket = submittedTicket;

    if (ticket) {
      saveOwnedGameChannelId(ticket.provisionalChannelId);
      saveUserSurfaceRole('channel-owner');
      syncGameOwnerSessionFromTicket(ticket.id);
    }

    props.onEnterPreApprovedChannel();
  }

  function updateQuestionnaireAnswer(questionId: string, optionId: string): void {
    updateDraft({
      questionnaireStarted: true,
      questionnaireAnswers: {
        ...draft.questionnaireAnswers,
        [questionId]: optionId,
      },
    });
  }

  const questionnaireComplete = isGameStudioQuestionnaireComplete(draft.questionnaireAnswers);

  return (
    <section className="game-onboarding-panel">
      <div className="onboarding-copy">
        <p className="eyebrow">Game onboarding</p>
        <h2>Submit your game to Nami Officials</h2>
        <p>
          Provide official contact details, authorize your game&apos;s X or Twitch account, link zkLogin,
          and build Trust Score proof. Tickets are sorted highest score first for officials.
        </p>
      </div>

      <GameTrustScorePanel compact draft={draft} showSuggestions />

      <div className="onboarding-card panel">
        <div className="onboarding-act-rail" aria-label="Game onboarding progress">
          {GAME_ONBOARDING_ACTS.map((step, index) => (
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

        {act === 'identity' ? (
          <div className="onboarding-step-body">
            <label className="onboarding-field">
              <span>Game title</span>
              <input
                onChange={(event) => updateDraft({ gameTitle: event.target.value })}
                placeholder="Your game name"
                type="text"
                value={draft.gameTitle}
              />
            </label>
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
            <button
              className="onboarding-primary-btn"
              disabled={!isGameIdentityStepReady(draft)}
              onClick={() => setAct('officials')}
              type="button"
            >
              Continue to official accounts
            </button>
          </div>
        ) : null}

        {act === 'officials' ? (
          <div className="onboarding-step-body">
            <fieldset className="onboarding-quiz-question">
              <legend>Official game account platform</legend>
              <p className="protocol-hint">
                Choose the platform where your game maintains its official presence, then sign in
                through the official {draft.officialSocialPlatform === 'twitch' ? 'Twitch' : 'X'}{' '}
                authorizer. You cannot type a handle manually.
              </p>
              <div className="onboarding-quiz-options">
                <label className="onboarding-quiz-option">
                  <input
                    checked={draft.officialSocialPlatform === 'x'}
                    name="official-social-platform"
                    onChange={() => handleOfficialPlatformChange('x')}
                    type="radio"
                  />
                  <span>X (official game account)</span>
                </label>
                <label className="onboarding-quiz-option">
                  <input
                    checked={draft.officialSocialPlatform === 'twitch'}
                    name="official-social-platform"
                    onChange={() => handleOfficialPlatformChange('twitch')}
                    type="radio"
                  />
                  <span>Twitch (official channel)</span>
                </label>
              </div>
            </fieldset>

            {draft.officialSocialPlatform ? (
              <GameOfficialSocialAuthControl
                gameTitle={draft.gameTitle}
                platform={draft.officialSocialPlatform}
              />
            ) : (
              <p className="protocol-hint">Select X or Twitch to open the official sign-in authorizer.</p>
            )}

            <div className="onboarding-zklogin-block">
              <p className="protocol-hint">Link zkLogin so Nami Officials can verify your Sui account.</p>
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
                Continue to game proof
              </button>
            </div>
          </div>
        ) : null}

        {act === 'proof' ? (
          <div className="onboarding-step-body">
            <fieldset className="onboarding-quiz-question">
              <legend>Game genre(s)</legend>
              <p className="protocol-hint">
                Select every genre that fits your game. At least one genre adds Trust Score proof.
              </p>
              <div className="onboarding-quiz-options onboarding-genre-options">
                {GAME_ONBOARDING_GENRES.map((genre) => (
                  <label className="onboarding-quiz-option" key={genre}>
                    <input
                      checked={draft.genres.includes(genre)}
                      name={'genre-' + genre}
                      onChange={() => toggleGenre(genre)}
                      type="checkbox"
                    />
                    <span>{genre}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="onboarding-quiz-question">
              <legend>Supported platform(s)</legend>
              <p className="protocol-hint">
                Select every platform where players can access your game. Mobile is supported as both
                a platform and a genre.
              </p>
              <div className="onboarding-quiz-options onboarding-genre-options">
                {SUPPORTED_PLATFORMS.map((platform) => (
                  <label className="onboarding-quiz-option" key={platform}>
                    <input
                      checked={draft.platforms.includes(platform)}
                      name={'platform-' + platform}
                      onChange={() => togglePlatform(platform)}
                      type="checkbox"
                    />
                    <span>{platform}</span>
                  </label>
                ))}
              </div>
            </fieldset>

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
                  placeholder={
                    storeField.key === 'steamStoreUrl'
                      ? 'https://store.steampowered.com/app/...'
                      : storeField.key === 'epicStoreUrl'
                        ? 'https://store.epicgames.com/...'
                        : storeField.key === 'xboxStoreUrl'
                          ? 'https://www.xbox.com/games/store/...'
                          : storeField.key === 'playstationStoreUrl'
                            ? 'https://store.playstation.com/...'
                            : 'https://...'
                  }
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
              <button className="onboarding-primary-btn" onClick={() => setAct('review')} type="button">
                Review ticket
              </button>
            </div>
          </div>
        ) : null}

        {act === 'review' ? (
          <div className="onboarding-step-body">
            <article className="onboarding-preview-card">
              <p className="onboarding-preview-status">Ticket preview</p>
              <h3>{draft.gameTitle.trim() || 'Untitled game'}</h3>
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
              ) : (
                <p className="protocol-hint">Add contact details, social links, and store pages to preview them here.</p>
              )}
              <p className="protocol-hint">
                Phone numbers stay on your device for Trust Score only and are not sent to Nami
                Officials.
              </p>
              <p className="protocol-hint">
                Trust Score {trustBreakdown.total}% ·{' '}
                {trustBreakdown.preapprovalEligible
                  ? 'Eligible for pre-approval and questionnaire.'
                  : 'Ticket will queue for manual review below 60%.'}
              </p>
            </article>

            {submittedTicket ? (
              <p className="protocol-hint">
                Ticket submitted as <strong>{submittedTicket.status}</strong>. Officials review highest
                Trust Score tickets first.
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
                  onClick={handleSubmitTicket}
                  type="button"
                >
                  Submit to Nami Officials
                </button>
              ) : null}
              {submittedTicket?.status === 'preapproved' ? (
                <button className="onboarding-primary-btn" onClick={() => setAct('questionnaire')} type="button">
                  Start questionnaire
                </button>
              ) : null}
              {submittedTicket?.status === 'preapproved' ? (
                <button
                  className="onboarding-secondary-btn"
                  onClick={handleEnterPreApprovedChannel}
                  type="button"
                >
                  Enter Nami (pre-approved channel)
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {act === 'questionnaire' ? (
          <div className="onboarding-step-body">
            <h3>Studio questionnaire</h3>
            <p className="protocol-hint">
              Pre-approved at {trustBreakdown.total}% Trust Score. Complete this short questionnaire before
              editing your hidden game channel.
            </p>

            {GAME_STUDIO_QUESTIONNAIRE_QUESTIONS.map((question) => (
              <fieldset className="onboarding-quiz-question" key={question.id}>
                <legend>{question.prompt}</legend>
                <div className="onboarding-quiz-options">
                  {question.options.map((option) => (
                    <label className="onboarding-quiz-option" key={option.id}>
                      <input
                        checked={draft.questionnaireAnswers[question.id] === option.id}
                        name={question.id}
                        onChange={() => updateQuestionnaireAnswer(question.id, option.id)}
                        type="radio"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}

            <div className="onboarding-step-actions">
              <button className="onboarding-secondary-btn" onClick={() => setAct('review')} type="button">
                Back
              </button>
              <button
                className="onboarding-primary-btn"
                disabled={!questionnaireComplete}
                onClick={handleEnterPreApprovedChannel}
                type="button"
              >
                Enter Nami and edit channel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {props.onBack ? (
        <button className="secondary-action entry-back-button" onClick={props.onBack} type="button">
          Back to role selection
        </button>
      ) : null}
    </section>
  );
}
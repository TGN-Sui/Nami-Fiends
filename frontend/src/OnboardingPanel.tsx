import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from 'react';

import {
  applyQuizToDraft,
  createEmptyDraft,
  loadOnboardingDraft,
  normalizeNodename,
  saveOnboardingDraft,
  type OnboardingDraft,
} from './onboarding-draft.js';
import {
  isQuizComplete,
  ONBOARDING_QUIZ_QUESTIONS,
} from './onboarding-quiz.js';
import {
  getOnboardingActIndex,
  ONBOARDING_ACTS,
  type OnboardingAct,
} from './onboarding.js';
import { ContactCodeVerificationControl } from './ContactCodeVerificationControl.js';
import { isContactVerified } from './contact-code-verification-store.js';
import { linkMemberSessionAuth } from './member-auth-link-store.js';
import { validatePasswordSetup } from './member-credential-store.js';
import {
  completeSignupFromDraft,
  isDraftReadyForSignup,
} from './member-session-store.js';
import { OfficialSocialAuthControl } from './OfficialSocialAuthControl.js';
import { useGamerScopedOfficialSocialAuthState } from './official-social-auth-store.js';
import { PlayerScorePanel } from './PlayerScorePanel.js';
import {
  recoveryEmailOnboardingHint,
  shouldShowRecoveryOnboardingNote,
} from './onboarding-recovery.js';
import { useProtocolOwner } from './wallet.js';

interface OnboardingPanelProps {
  onEnterHub?: () => void;
  onNavigateToSettings?: () => void;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function OnboardingPanel(props: OnboardingPanelProps): ReactElement {
  const { owner, source } = useProtocolOwner();
  const gamerSocialAuth = useGamerScopedOfficialSocialAuthState();
  const [act, setAct] = useState<OnboardingAct>('create');
  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    return loadOnboardingDraft() ?? createEmptyDraft();
  });
  const [signupError, setSignupError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const actIndex = getOnboardingActIndex(act);
  const quizComplete = isQuizComplete(draft.quizAnswers);
  const passwordValidation = validatePasswordSetup(password, confirmPassword);
  const createReady =
    draft.displayName.trim().length >= 2 &&
    isValidEmail(draft.email) &&
    draft.emailVerified &&
    quizComplete &&
    passwordValidation.ok;
  const signupReady = isDraftReadyForSignup(draft, password, confirmPassword);

  useEffect(() => {
    saveOnboardingDraft(draft);
  }, [draft]);

  useEffect(() => {
    const emailVerified = isContactVerified('email', draft.email);

    if (emailVerified === draft.emailVerified) {
      return;
    }

    setDraft((current) => ({
      ...current,
      emailVerified,
    }));
  }, [draft.email, draft.emailVerified]);

  useEffect(() => {
    const socialXHandle = gamerSocialAuth.x.handle ?? '';
    const socialTwitchHandle = gamerSocialAuth.twitch.handle ?? '';
    const socialXVerified = gamerSocialAuth.x.verified;
    const socialTwitchVerified = gamerSocialAuth.twitch.verified;

    if (
      socialXHandle === draft.socialXHandle &&
      socialTwitchHandle === draft.socialTwitchHandle &&
      socialXVerified === draft.socialXVerified &&
      socialTwitchVerified === draft.socialTwitchVerified
    ) {
      return;
    }

    setDraft((current) => ({
      ...current,
      socialXHandle,
      socialXVerified,
      socialTwitchHandle,
      socialTwitchVerified,
    }));
  }, [
    draft.socialXHandle,
    draft.socialTwitchHandle,
    draft.socialXVerified,
    draft.socialTwitchVerified,
    gamerSocialAuth.twitch.handle,
    gamerSocialAuth.twitch.verified,
    gamerSocialAuth.x.handle,
    gamerSocialAuth.x.verified,
  ]);

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const updateQuizAnswer = useCallback((questionId: string, optionId: string) => {
    setDraft((current) => {
      return applyQuizToDraft(current, {
        ...current.quizAnswers,
        [questionId]: optionId,
      });
    });
  }, []);

  function handleEnterNami(): void {
    setSignupError(null);

    if (!signupReady) {
      setSignupError('Complete display name, email, password, and quiz before entering Nami.');
      return;
    }

    const session = completeSignupFromDraft(draft, password, confirmPassword);

    if (!session) {
      setSignupError('Could not complete signup. Check your details and try again.');
      return;
    }

    linkMemberSessionAuth(session, {
      email: session.email,
      xHandle: draft.socialXVerified ? draft.socialXHandle : null,
      zkLoginAddress: source === 'zklogin' ? owner : null,
      walletAddress: source === 'wallet' ? owner : null,
    });

    props.onEnterHub?.();
  }

  return (
    <section className="onboarding-panel">
      <div className="onboarding-copy">
        <p className="eyebrow">Enter Nami</p>
        <h2>Tell us who you are, then step into the hub.</h2>
        <p>
          Sign up with your display name and email. Every passport is issued a Player Score that
          rises as you link socials and game platforms from Settings.
        </p>
      </div>

      <PlayerScorePanel compact draft={draft} showSuggestions />

      <div className="onboarding-card panel">
        <div className="onboarding-act-rail" aria-label="Onboarding progress">
          {ONBOARDING_ACTS.map((step, index) => (
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

        {act === 'create' ? (
          <div className="onboarding-step-body">
            <label className="onboarding-field">
              <span>Display name</span>
              <input
                maxLength={32}
                onChange={(event) => updateDraft({ displayName: event.target.value })}
                placeholder="How friends see you"
                type="text"
                value={draft.displayName}
              />
            </label>

            <ContactCodeVerificationControl
              autoComplete="email"
              channel="email"
              inputType="email"
              label="Email"
              onChange={(email) => updateDraft({ email })}
              onVerifiedChange={(emailVerified) => updateDraft({ emailVerified })}
              optionalHint="Used for claim review and account recovery notices. Verify with the code we send before continuing."
              placeholder="you@example.com"
              value={draft.email}
              verified={draft.emailVerified}
            />
            {shouldShowRecoveryOnboardingNote() ? (
              <p className="protocol-hint">{recoveryEmailOnboardingHint()}</p>
            ) : null}

            <label className="onboarding-field">
              <span>Password</span>
              <input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError(null);
                }}
                placeholder="At least 8 characters"
                type="password"
                value={password}
              />
            </label>

            <label className="onboarding-field">
              <span>Confirm password</span>
              <input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setPasswordError(null);
                }}
                placeholder="Re-enter your password"
                type="password"
                value={confirmPassword}
              />
            </label>

            {password.length > 0 || confirmPassword.length > 0 ? (
              <p className={passwordValidation.ok ? 'protocol-hint' : 'onboarding-field-error'}>
                {passwordValidation.ok ? 'Password ready.' : passwordValidation.message}
              </p>
            ) : null}
            {passwordError ? <p className="onboarding-field-error">{passwordError}</p> : null}

            <div className="onboarding-quiz-block">
              <h3>Gamer quiz</h3>
              <p className="protocol-hint">
                Placeholder questions — archetype maps to your starting badge flavor.
              </p>
              {ONBOARDING_QUIZ_QUESTIONS.map((question) => (
                <fieldset className="onboarding-quiz-question" key={question.id}>
                  <legend>{question.prompt}</legend>
                  <div className="onboarding-quiz-options">
                    {question.options.map((option) => (
                      <label className="onboarding-quiz-option" key={option.id}>
                        <input
                          checked={draft.quizAnswers[question.id] === option.id}
                          name={question.id}
                          onChange={() => updateQuizAnswer(question.id, option.id)}
                          type="radio"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            {!createReady ? (
              <p className="protocol-hint">
                {draft.emailVerified
                  ? passwordValidation.ok
                    ? 'Answer every quiz question to continue.'
                    : 'Set and confirm your password (8+ characters), then finish the quiz.'
                  : 'Verify your email with Send code before the password step unlocks Continue.'}
              </p>
            ) : null}

            <button
              className="onboarding-primary-btn"
              disabled={!createReady}
              onClick={() => setAct('social')}
              type="button"
            >
              Continue to social verification
            </button>
          </div>
        ) : null}

        {act === 'social' ? (
          <div className="onboarding-step-body">
            <h3>Optional social verification</h3>
            <p className="protocol-hint">
              Sign in with X or Twitch through the official authorizer to boost your starting Player
              Score. Manual handle entry is not accepted. Skip either platform and link later from
              Settings.
            </p>

            <OfficialSocialAuthControl
              mockHandleSeed={draft.displayName}
              platform="x"
              scope="gamer"
            />
            <OfficialSocialAuthControl
              mockHandleSeed={draft.displayName}
              platform="twitch"
              scope="gamer"
            />

            <div className="onboarding-step-actions">
              <button className="onboarding-secondary-btn" onClick={() => setAct('create')} type="button">
                Back
              </button>
              <button className="onboarding-primary-btn" onClick={() => setAct('preview')} type="button">
                Preview passport
              </button>
            </div>
          </div>
        ) : null}

        {act === 'preview' ? (
          <div className="onboarding-step-body">
            <article className="onboarding-preview-card">
              <p className="onboarding-preview-status">Ready to enter</p>
              <h3>{draft.displayName.trim() || 'Unnamed adventurer'}</h3>
              <p>{draft.email.trim().toLowerCase() || 'email@pending'}</p>
              <div className="onboarding-preview-meta">
                <span>{draft.archetypeLabel}</span>
                <span>{draft.flavorBadgeId}</span>
              </div>
              <p className="protocol-hint">
                Your passport will be issued with the Player Score below. Link Steam, Epic, X, and more
                from Settings to raise it after you enter the hub.
              </p>
            </article>

            <PlayerScorePanel compact draft={draft} />

            {signupError ? <p className="onboarding-field-error">{signupError}</p> : null}

            <div className="onboarding-step-actions">
              <button className="onboarding-secondary-btn" onClick={() => setAct('social')} type="button">
                Edit draft
              </button>
              <button
                className="onboarding-primary-btn"
                disabled={!signupReady}
                onClick={handleEnterNami}
                type="button"
              >
                Enter Nami
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

import { buildEnterNamiTransaction } from './onboarding-tx.js';

import {
  applyQuizToDraft,
  clearOnboardingDraft,
  createEmptyDraft,
  isDraftReadyForClaim,
  isDraftReadyForPreview,
  loadOnboardingDraft,
  nodenameValidationMessage,
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
  getOnboardingMethodLabel,
  ONBOARDING_ACTS,
  type OnboardingAct,
  type OnboardingMethod,
} from './onboarding.js';
import { usePassportQuery } from './protocol-query.js';
import { useProtocolOwner, WalletConnectControl, ZkLoginConnectControl } from './wallet.js';
import { zkLoginStatusMessage } from './zklogin.js';

interface OnboardingPanelProps {
  packageId: string;
  network: string;
  isPackageConfigured: boolean;
  onNavigateToSettings?: () => void;
}

export function OnboardingPanel(props: OnboardingPanelProps): ReactElement {
  const { owner, source } = useProtocolOwner();
  const claimOwnerReady = owner !== null && source !== 'zklogin';
  const { mutate: signAndExecute, isPending: claimPending } = useSignAndExecuteTransaction();

  const [act, setAct] = useState<OnboardingAct>('create');
  const [method, setMethod] = useState<OnboardingMethod>(
    source === 'wallet' ? 'wallet' : source === 'demo' ? 'demo' : 'wallet'
  );
  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    return loadOnboardingDraft() ?? createEmptyDraft();
  });
  const { data: passportView, loadState: passportLoadState } = usePassportQuery();
  const hasPassport = passportView?.passport != null;
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  const methodLabel = useMemo(() => getOnboardingMethodLabel(method), [method]);
  const actIndex = getOnboardingActIndex(act);
  const quizComplete = isQuizComplete(draft.quizAnswers);
  const previewReady = isDraftReadyForPreview(draft) && quizComplete;
  const claimReady = isDraftReadyForClaim(draft);
  const nodenameError = nodenameValidationMessage(draft.nodename);

  useEffect(() => {
    saveOnboardingDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (source === 'wallet') {
      setMethod('wallet');
    } else if (source === 'zklogin') {
      setMethod('zklogin');
    } else if (source === 'demo') {
      setMethod('demo');
    }
  }, [source]);

  useEffect(() => {
    if (hasPassport && passportLoadState === 'ready') {
      setAct('verify');
      clearOnboardingDraft();
    }
  }, [hasPassport, passportLoadState]);

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

  function handleClaim(): void {
    setClaimError(null);
    setClaimNotice(null);

    if (!props.isPackageConfigured) {
      setClaimError('Configure VITE_NAMI_PACKAGE_ID before claiming on-chain.');
      return;
    }

    if (!owner) {
      setClaimError('Connect a wallet, zkLogin, or enable demo owner before claiming.');
      return;
    }

    if (source === 'zklogin') {
      setClaimError(
        'zkLogin read session is active. Connect a wallet to sign the enter_nami claim transaction.'
      );
      return;
    }

    if (!claimReady) {
      setClaimError('Complete display name, quiz, and nodename before claiming.');
      return;
    }

    try {
      const tx = buildEnterNamiTransaction(props.packageId, {
        nodename: normalizeNodename(draft.nodename),
        displayName: draft.displayName.trim(),
        archetype: draft.archetype,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            setClaimNotice(
              'Claim submitted. When enter_nami is deployed, this mints Identity, Passport, and onboarding badge in one step.'
            );
            clearOnboardingDraft();
            setAct('verify');
          },
          onError: (error) => {
            const message =
              error instanceof Error
                ? error.message
                : 'Claim failed. enter_nami may not be deployed yet.';
            setClaimError(message);
          },
        }
      );
    } catch (error) {
      setClaimError(
        error instanceof Error ? error.message : 'Could not build enter_nami transaction.'
      );
    }
  }

  if (hasPassport && act === 'verify') {
    return (
      <section className="onboarding-panel onboarding-panel-compact">
        <div className="onboarding-verify-banner panel">
          <p className="eyebrow">Verify</p>
          <h2>Passport claimed — link platforms for achievement badges.</h2>
          <p className="protocol-hint">
            Only achievements unlocked after your Passport was created can earn badges.
            Platform accounts verify one Passport forever.
          </p>
          {props.onNavigateToSettings ? (
            <button className="onboarding-primary-btn" onClick={props.onNavigateToSettings} type="button">
              Open Settings → Identity
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="onboarding-panel">
      <div className="onboarding-copy">
        <p className="eyebrow">Enter Nami</p>
        <h2>Create your passport, claim it once, then verify platforms.</h2>
        <p>
          Act 1 is free. Act 2 is one wallet approval. Act 3 links Steam, Epic, Xbox, and more for
          real achievement badges.
        </p>
      </div>

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

            <div className="onboarding-quiz-block">
              <h3>Gamer quiz</h3>
              <p className="protocol-hint">Placeholder questions — archetype maps to your starting badge flavor.</p>
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

            <button
              className="onboarding-primary-btn"
              disabled={!previewReady}
              onClick={() => setAct('preview')}
              type="button"
            >
              Preview passport
            </button>
          </div>
        ) : null}

        {act === 'preview' ? (
          <div className="onboarding-step-body">
            <article className="onboarding-preview-card">
              <p className="onboarding-preview-status">Created, not owned</p>
              <h3>{draft.displayName.trim() || 'Unnamed adventurer'}</h3>
              <p>@{normalizeNodename(draft.nodename) || 'nodename-at-claim'}</p>
              <div className="onboarding-preview-meta">
                <span>{draft.archetypeLabel}</span>
                <span>{draft.flavorBadgeId}</span>
              </div>
              <p className="protocol-hint">
                Claim on-chain to own your Identity, Passport, Conduct, Profile, and onboarding Basic
                badge in one transaction.
              </p>
            </article>

            <div className="onboarding-step-actions">
              <button className="onboarding-secondary-btn" onClick={() => setAct('create')} type="button">
                Edit draft
              </button>
              <button className="onboarding-primary-btn" onClick={() => setAct('claim')} type="button">
                Continue to claim
              </button>
            </div>
          </div>
        ) : null}

        {act === 'claim' ? (
          <div className="onboarding-step-body">
            <div className="method-toggle" aria-label="Onboarding method">
              <button
                className={method === 'wallet' ? 'active' : ''}
                onClick={() => setMethod('wallet')}
                type="button"
              >
                Wallet
              </button>
              <button
                className={method === 'zklogin' ? 'active' : ''}
                onClick={() => setMethod('zklogin')}
                type="button"
              >
                zkLogin
              </button>
              <button
                className={method === 'demo' ? 'active' : ''}
                onClick={() => setMethod('demo')}
                type="button"
              >
                Demo
              </button>
            </div>

            <div className="onboarding-status">
              <div>
                <span>Method</span>
                <strong>{methodLabel}</strong>
              </div>
              <div>
                <span>Network</span>
                <strong>{props.network}</strong>
              </div>
              <div>
                <span>Package</span>
                <strong>{props.isPackageConfigured ? 'Configured' : 'Missing'}</strong>
              </div>
            </div>

            {method === 'wallet' ? (
              <div className="onboarding-wallet-connect">
                <WalletConnectControl />
              </div>
            ) : null}

            {method === 'zklogin' ? (
              <div className="onboarding-zklogin-block">
                <p className="protocol-hint">{zkLoginStatusMessage()}</p>
                <ZkLoginConnectControl />
                <p className="protocol-hint">
                  zkLogin establishes your Sui address for protocol reads. On-chain claim transactions
                  still require a signing wallet until the zkLogin prover path is wired.
                </p>
              </div>
            ) : null}

            <label className="onboarding-field">
              <span>Nodename</span>
              <input
                maxLength={24}
                onChange={(event) => updateDraft({ nodename: event.target.value })}
                placeholder="your_handle"
                type="text"
                value={draft.nodename}
              />
              {nodenameError && draft.nodename.trim() !== '' ? (
                <small className="onboarding-field-error">{nodenameError}</small>
              ) : (
                <small className="protocol-hint">Your stable @handle — chosen once at claim.</small>
              )}
            </label>

            <div className="onboarding-package">
              <span>Archetype</span>
              <code>
                {draft.archetypeLabel} ({draft.archetype}) · {draft.flavorBadgeId}
              </code>
            </div>

            {claimError ? <p className="onboarding-field-error">{claimError}</p> : null}
            {claimNotice ? <p className="protocol-hint">{claimNotice}</p> : null}

            <button
              className="onboarding-primary-btn"
              disabled={!claimReady || claimPending || !claimOwnerReady}
              onClick={handleClaim}
              type="button"
            >
              {claimPending ? 'Claiming…' : 'Claim on-chain (enter_nami)'}
            </button>

            {!claimOwnerReady ? (
              <p className="protocol-hint">
                {source === 'zklogin'
                  ? 'Connect a wallet to sign the claim transaction.'
                  : 'Connect a wallet to sign the claim transaction.'}
              </p>
            ) : null}
          </div>
        ) : null}

        {act === 'verify' ? (
          <div className="onboarding-step-body">
            <p>
              Link Steam, Epic, Xbox, and other platforms in Settings. Achievements before your Passport
              was created cannot be claimed. Unlinking removes platform-sourced badges permanently.
            </p>
            {props.onNavigateToSettings ? (
              <button className="onboarding-primary-btn" onClick={props.onNavigateToSettings} type="button">
                Open Settings → Identity
              </button>
            ) : (
              <p className="protocol-hint">Open Settings → Identity to link platforms.</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
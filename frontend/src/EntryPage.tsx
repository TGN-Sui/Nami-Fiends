import { useEffect, useState, type ReactElement } from 'react';

import { AccountConnectSection } from './account-connect.js';
import {
  LANDING_HERO,
  LANDING_PILLARS,
  LANDING_SCENARIOS,
  LANDING_STEPS,
} from './landing-content.js';
import { clearSignedOut, isSignedOut, useSignedOut } from './member-auth-store.js';
import {
  clearMemberSession,
  hasActiveMemberSession,
  useMemberSession,
} from './member-session-store.js';
import { OnboardingPanel } from './OnboardingPanel.js';
import { useProtocolOwner } from './wallet.js';

function LandingScenarioCard(props: { scenario: (typeof LANDING_SCENARIOS)[number] }): ReactElement {
  return (
    <article className="nami-landing-scenario-card">
      <h3>{props.scenario.title}</h3>
      <div className="nami-landing-scenario-body">
        <div>
          <span className="nami-landing-scenario-label">Without Nami</span>
          <p>{props.scenario.pain}</p>
        </div>
        <div>
          <span className="nami-landing-scenario-label is-nami">With Nami</span>
          <p>{props.scenario.namiWay}</p>
        </div>
      </div>
      <footer className="nami-landing-scenario-outcome">
        <strong>{props.scenario.outcome}</strong>
      </footer>
    </article>
  );
}

function LandingOverview(props: {
  onEnterNami: () => void;
  onBrowseGuest: () => void;
}): ReactElement {
  return (
    <div className="nami-landing-shell">
      <section className="nami-landing-hero panel">
        <div className="nami-landing-hero-copy">
          <span className="mini-badge">{LANDING_HERO.eyebrow}</span>
          <h1>{LANDING_HERO.headline}</h1>
          <p>{LANDING_HERO.subhead}</p>
          <p className="nami-landing-trust-note">{LANDING_HERO.trustNote}</p>
        </div>

        <div className="nami-landing-hero-actions">
          <button className="primary-action" onClick={props.onEnterNami} type="button">
            Enter Nami — it&apos;s free to start
          </button>
          <button className="secondary-action" onClick={props.onBrowseGuest} type="button">
            Browse Game Hub as guest
          </button>
        </div>

        <ul className="nami-landing-hero-stats" aria-label="What you get on Nami">
          <li>
            <strong>Passport</strong>
            <span>Portable identity card</span>
          </li>
          <li>
            <strong>Channels</strong>
            <span>One home per game</span>
          </li>
          <li>
            <strong>Conduct</strong>
            <span>Safety that follows you</span>
          </li>
        </ul>
      </section>

      <section className="nami-landing-section">
        <header className="nami-landing-section-head">
          <span className="mini-badge">Real situations</span>
          <h2>Built for how gamers actually lose their communities</h2>
          <p>
            These are the moments that inspired Nami — not abstract Web3 talk. If you have lived one
            of these, you already know why a portable layer matters.
          </p>
        </header>

        <div className="nami-landing-scenario-grid">
          {LANDING_SCENARIOS.map((scenario) => (
            <LandingScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </section>

      <section className="nami-landing-section panel nami-landing-pillars-panel">
        <header className="nami-landing-section-head">
          <span className="mini-badge">What Nami is</span>
          <h2>Identity, community, and safety — in one gamer-native world</h2>
        </header>

        <div className="nami-landing-pillar-grid">
          {LANDING_PILLARS.map((pillar) => (
            <article className="nami-landing-pillar-card" key={pillar.title}>
              <strong>{pillar.title}</strong>
              <p>{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nami-landing-section panel nami-landing-steps-panel">
        <header className="nami-landing-section-head">
          <span className="mini-badge">Get started</span>
          <h2>Three steps into the world</h2>
          <p>You can explore Game Hub and genre chats before claiming a passport.</p>
        </header>

        <ol className="nami-landing-step-list">
          {LANDING_STEPS.map((step) => (
            <li className="nami-landing-step-card" key={step.step}>
              <span className="nami-landing-step-index">{step.step}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="nami-landing-final-cta">
          <button className="primary-action" onClick={props.onEnterNami} type="button">
            Start signup
          </button>
          <button className="secondary-action" onClick={props.onBrowseGuest} type="button">
            Skip to Game Hub
          </button>
        </div>
      </section>
    </div>
  );
}

export function EntryPage(props: {
  onEnterHub: () => void;
  onBrowseGameHub?: () => void;
  onNavigateToSettings?: () => void;
  startOnboarding?: boolean;
  onStartOnboardingHandled?: () => void;
}): ReactElement {
  const session = useMemberSession();
  const signedOut = useSignedOut();
  const { owner } = useProtocolOwner();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!props.startOnboarding) {
      return;
    }

    setShowOnboarding(true);
    props.onStartOnboardingHandled?.();
  }, [props.startOnboarding, props.onStartOnboardingHandled]);

  useEffect(() => {
    if (signedOut && owner) {
      clearSignedOut();
      props.onEnterHub();
    }
  }, [signedOut, owner, props.onEnterHub]);

  function startFreshSignup(): void {
    clearMemberSession();
    clearSignedOut();
    setShowOnboarding(true);
  }

  function browseAsGuest(): void {
    if (props.onBrowseGameHub) {
      props.onBrowseGameHub();
      return;
    }

    props.onEnterHub();
  }

  if (showOnboarding) {
    return (
      <div className="nami-entry-onboarding-shell">
        <header className="page-title nami-entry-onboarding-title">
          <p>Welcome to Nami</p>
          <h1>Enter Nami</h1>
        </header>

        <OnboardingPanel
          onEnterHub={() => {
            clearSignedOut();
            props.onEnterHub();
          }}
          {...(props.onNavigateToSettings
            ? { onNavigateToSettings: props.onNavigateToSettings }
            : {})}
        />

        <button className="secondary-action entry-back-button" onClick={() => setShowOnboarding(false)} type="button">
          Back to overview
        </button>
      </div>
    );
  }

  if (signedOut || isSignedOut()) {
    return (
      <section className="nami-entry-page panel nami-entry-signed-out">
        <div className="nami-entry-hero">
          <span className="mini-badge">Signed out</span>
          <h1>Sign back in to continue</h1>
          <p>
            Use your preferred login to return to Nami. If you cannot restore your session, sign up
            again and complete the passport creation flow.
          </p>
        </div>

        <AccountConnectSection />

        <div className="nami-entry-actions">
          <button className="primary-action" onClick={startFreshSignup} type="button">
            Sign up again
          </button>
        </div>
      </section>
    );
  }

  if (hasActiveMemberSession() && session) {
    return (
      <section className="nami-entry-page panel nami-entry-returning">
        <div className="nami-entry-hero">
          <span className="mini-badge">Welcome back</span>
          <h1>Hi, {session.displayName}</h1>
          <p>
            You are signed up as {session.email}. Claim your passport nodename and link platforms
            anytime from Settings.
          </p>
        </div>

        <div className="nami-entry-actions">
          <button className="primary-action" onClick={props.onEnterHub} type="button">
            Enter Nami Hub
          </button>
          {props.onBrowseGameHub ? (
            <button className="secondary-action" onClick={props.onBrowseGameHub} type="button">
              Open Game Hub
            </button>
          ) : null}
          {props.onNavigateToSettings ? (
            <button className="secondary-action" onClick={props.onNavigateToSettings} type="button">
              Open Settings
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <LandingOverview
      onBrowseGuest={browseAsGuest}
      onEnterNami={() => setShowOnboarding(true)}
    />
  );
}
import { useEffect, useState, type ReactElement } from 'react';

import { LandingHeroVisual } from './LandingHeroVisual.js';
import { LandingScenarioDeck } from './LandingScenarioDeck.js';
import {
  LANDING_GENRE_LOUNGES,
  LANDING_HERO,
  LANDING_PILLARS,
  LANDING_STEPS,
} from './landing-content.js';
import { clearSignedOut } from './member-auth-store.js';
import {
  clearMemberSession,
  hasActiveMemberSession,
  useMemberSession,
} from './member-session-store.js';
import { OnboardingPanel } from './OnboardingPanel.js';

function LandingOverview(props: {
  onEnterNami: () => void;
  signedOutNotice?: boolean;
}): ReactElement {
  return (
    <div className="nami-landing-shell">
      {props.signedOutNotice ? (
        <p className="nami-landing-signed-out-note">
          Your session ended. Sign up again to enter Nami.
        </p>
      ) : null}

      <section className="nami-landing-hero panel">
        <div className="nami-landing-hero-layout">
          <div className="nami-landing-hero-copy">
            <span className="mini-badge">{LANDING_HERO.eyebrow}</span>
            <h1>{LANDING_HERO.headline}</h1>
            <p>{LANDING_HERO.subhead}</p>
            <p className="nami-landing-trust-note">{LANDING_HERO.trustNote}</p>

            <div className="nami-landing-hero-actions">
              <button className="primary-action" onClick={props.onEnterNami} type="button">
                Enter Nami — it&apos;s free to start
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
                <strong>Genre chats</strong>
                <span>Official lounges by play style</span>
              </li>
            </ul>
          </div>

          <LandingHeroVisual />
        </div>
      </section>

      <section className="nami-landing-section">
        <header className="nami-landing-section-head">
          <span className="mini-badge">Real situations</span>
          <h2>Built for how gamers actually lose their communities</h2>
          <p>
            Draw from the deck — each TCG-style card is a moment that inspired Nami. Flip to see the
            split between life without Nami and life with a portable gamer layer.
          </p>
        </header>

        <LandingScenarioDeck />
      </section>

      <section className="nami-landing-section panel nami-landing-genre-panel">
        <header className="nami-landing-section-head">
          <span className="mini-badge">Genre global chats</span>
          <h2>Every genre has an official lounge — not just every game</h2>
          <p>
            After signup, jump into Nami Hub and Game Hub to find global chats grouped by how you
            play: FPS, RPG, MOBA, sports, sandbox, and more. Bubble size reflects live activity.
          </p>
        </header>

        <ul className="nami-landing-genre-chip-list" aria-label="Official genre lounges">
          {LANDING_GENRE_LOUNGES.map((lounge) => (
            <li key={lounge}>{lounge}</li>
          ))}
        </ul>
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
          <p>Signup unlocks your passport, Game Hub discovery, and official genre lounges.</p>
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
        </div>
      </section>
    </div>
  );
}

export function EntryPage(props: {
  onEnterHub: () => void;
  onNavigateToSettings?: () => void;
  startOnboarding?: boolean;
  onStartOnboardingHandled?: () => void;
  signedOutNotice?: boolean;
}): ReactElement {
  const session = useMemberSession();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!props.startOnboarding) {
      return;
    }

    setShowOnboarding(true);
    props.onStartOnboardingHandled?.();
  }, [props.startOnboarding, props.onStartOnboardingHandled]);

  function startFreshSignup(): void {
    clearMemberSession();
    clearSignedOut();
    setShowOnboarding(true);
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
      onEnterNami={startFreshSignup}
      {...(props.signedOutNotice ? { signedOutNotice: true } : {})}
    />
  );
}
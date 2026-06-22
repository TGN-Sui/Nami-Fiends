import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';

import { LandingGenreBubbleField } from './LandingGenreBubbleField.js';
import { NamiGridSpotlight } from './NamiGridSpotlight.js';
import { LandingHeroVisual } from './LandingHeroVisual.js';
import { LandingScenarioDeck } from './LandingScenarioDeck.js';
import { genreBubbleScaleFromWeeklyChatters } from './bubble-weekly-scale.js';
import { genreOfficialChats, resolveGenreChatWeeklyActiveMembers } from './global-chats.js';
import {
  LANDING_GENRE_LOUNGES,
  LANDING_HERO,
  LANDING_PILLARS,
  LANDING_STEPS,
} from './landing-content.js';
import { EntryLoginPanel } from './EntryLoginPanel.js';
import { clearSignedOut } from './member-auth-store.js';
import { restoreMemberSessionByZkLoginAddress } from './member-auth-link-store.js';
import { resolveMemberDisplayName } from './member-display-name-store.js';
import {
  clearMemberSession,
  hasActiveMemberSession,
  useMemberSession,
} from './member-session-store.js';
import { getZkLoginSession } from './zklogin.js';
import { OwnerEditableImage } from './OwnerEditableImage.js';
import { GameChannelClaimPanel } from './GameChannelClaimPanel.js';
import { GameOnboardingPanel } from './GameOnboardingPanel.js';
import { GameStudioPathSelector, type GameStudioPath } from './GameStudioPathSelector.js';
import { OnboardingPanel } from './OnboardingPanel.js';
import { OnboardingRoleSelector, type OnboardingRole } from './OnboardingRoleSelector.js';

const GENRE_SHOWCASE_POP_HIGHLIGHT_MS = 1200;

type EntryGateMode = 'choose' | 'sign-in';

function EntryGatePanel(props: {
  onClose: () => void;
  onEnterHub: () => void;
  onNavigateToSettings?: () => void;
  onStartSignup: () => void;
}): ReactElement {
  const session = useMemberSession();
  const [mode, setMode] = useState<EntryGateMode>('choose');

  if (hasActiveMemberSession() && session) {
    return (
      <article className="nami-entry-gate-dialog panel">
        <button
          aria-label="Close entry prompt"
          className="nami-entry-gate-close"
          onClick={props.onClose}
          type="button"
        >
          Close
        </button>

        <div className="nami-entry-gate-copy">
          <span className="mini-badge">Welcome back</span>
          <h2 id="nami-entry-gate-title">
            Hi, {resolveMemberDisplayName('m1', session.displayName)}
          </h2>
          <p>
            You are signed in as {session.email}. Enter the hub or open Settings to manage your
            passport and linked platforms.
          </p>
        </div>

        <div className="nami-entry-gate-actions">
          <button className="primary-action" onClick={props.onEnterHub} type="button">
            Enter Nami Hub
          </button>
          {props.onNavigateToSettings ? (
            <button className="secondary-action" onClick={props.onNavigateToSettings} type="button">
              Open Settings
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  if (mode === 'sign-in') {
    return (
      <article className="nami-entry-gate-dialog panel nami-entry-gate-dialog-login">
        <button
          aria-label="Close log in"
          className="nami-entry-gate-close"
          onClick={props.onClose}
          type="button"
        >
          Close
        </button>

        <EntryLoginPanel
          onBack={() => setMode('choose')}
          onLoginSuccess={() => {
            clearSignedOut();
            props.onClose();
          }}
        />
      </article>
    );
  }

  return (
    <article className="nami-entry-gate-dialog panel">
      <button
        aria-label="Close entry prompt"
        className="nami-entry-gate-close"
        onClick={props.onClose}
        type="button"
      >
        Close
      </button>

      <div className="nami-entry-gate-copy">
        <span className="mini-badge">Enter Nami</span>
        <h2 id="nami-entry-gate-title">Log in or sign up</h2>
        <p>
          Log in with Google, email, or X. Sign up to choose Gamer or Game and create your passport.
        </p>
      </div>

      <div className="nami-entry-gate-actions">
        <button className="primary-action" onClick={() => setMode('sign-in')} type="button">
          Log in
        </button>
        <button
          className="secondary-action"
          onClick={() => {
            props.onClose();
            props.onStartSignup();
          }}
          type="button"
        >
          Sign up
        </button>
      </div>
    </article>
  );
}

function LandingOverview(props: {
  onEnterNami: () => void;
  signedOutNotice?: boolean;
}): ReactElement {
  const [genrePopHighlight, setGenrePopHighlight] = useState<{ chatId: string; pulse: number } | null>(
    null
  );
  const genreHighlightTimerRef = useRef<number | null>(null);

  const handleGenreBubblePop = useCallback((chatId: string): void => {
    if (genreHighlightTimerRef.current !== null) {
      window.clearTimeout(genreHighlightTimerRef.current);
    }

    setGenrePopHighlight({ chatId, pulse: Date.now() });
    genreHighlightTimerRef.current = window.setTimeout(() => {
      setGenrePopHighlight(null);
      genreHighlightTimerRef.current = null;
    }, GENRE_SHOWCASE_POP_HIGHLIGHT_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (genreHighlightTimerRef.current !== null) {
        window.clearTimeout(genreHighlightTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="nami-landing-shell">
      <NamiGridSpotlight scope="landing" />
      <LandingGenreBubbleField onGenrePop={handleGenreBubblePop} />

      <div className="nami-landing-foreground">
      <header className="nami-landing-official-logo-bar">
        <OwnerEditableImage
          className="nami-landing-official-logo"
          fallback={<span aria-hidden="true">Nami</span>}
          label="Official Nami logo"
          nested
          slotId="sidebar-official-logo"
        />
      </header>

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
                Enter Nami. It&apos;s free to start
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
            Draw from the deck. Each TCG style card is a moment that inspired Nami. Flip to see the
            split between life without Nami and life with a portable gamer layer.
          </p>
        </header>

        <LandingScenarioDeck />
      </section>

      <section className="nami-landing-section panel nami-landing-genre-panel">
        <header className="nami-landing-section-head">
          <span className="mini-badge">Genre global chats</span>
          <h2>Every genre has an official lounge, not just every game</h2>
          <p>
            After signup, jump into Nami Hub and Game Hub for all 23 official IGDB genre lounges,
            from Shooter and MOBA to Visual Novel and Pinball. Bubble size reflects weekly active chatters.
          </p>
        </header>

        <div className="nami-landing-genre-showcase" aria-label="Official genre lounge bubbles preview">
          {genreOfficialChats.slice(0, 8).map((chat) => {
            const isHighlighted = genrePopHighlight?.chatId === chat.id;
            const weeklyActiveMembers = resolveGenreChatWeeklyActiveMembers(chat);
            const showcaseScale = 0.62 * genreBubbleScaleFromWeeklyChatters(weeklyActiveMembers);

            return (
            <div
              className={
                'nami-landing-genre-showcase-bubble' + (isHighlighted ? ' is-genre-pop-highlight' : '')
              }
              key={isHighlighted ? chat.id + '-' + genrePopHighlight.pulse : chat.id}
              style={{ '--bubble-scale': String(showcaseScale) } as CSSProperties}
            >
              <strong>{chat.title}</strong>
              <small>{weeklyActiveMembers.toLocaleString()} active this week</small>
            </div>
            );
          })}
        </div>

        <ul className="nami-landing-genre-chip-list" aria-label="Official genre lounges">
          {LANDING_GENRE_LOUNGES.map((lounge) => (
            <li key={lounge}>{lounge}</li>
          ))}
        </ul>
      </section>

      <section className="nami-landing-section panel nami-landing-pillars-panel">
        <header className="nami-landing-section-head">
          <span className="mini-badge">What Nami is</span>
          <h2>Five pillars that keep your gamer life portable</h2>
          <p>
            Each piece solves a different break point: identity, home channels, genre rooms, persistent
            crews, and rooms worth staying in.
          </p>
        </header>

        <div className="nami-landing-pillar-grid" aria-label="Nami platform pillars">
          {LANDING_PILLARS.map((pillar) => (
            <article
              className={[
                'nami-landing-pillar-card',
                pillar.variant === 'featured' ? 'is-featured' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={pillar.id}
            >
              <div className="nami-landing-pillar-card-head">
                <span className="nami-landing-pillar-index" aria-hidden="true">
                  {pillar.index}
                </span>
                <span className="nami-landing-pillar-tag">{pillar.tag}</span>
              </div>
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
    </div>
  );
}

export function EntryPage(props: {
  onEnterHub: () => void;
  onEnterPreApprovedGame?: () => void;
  onEntryGateHandled?: () => void;
  onNavigateToSettings?: () => void;
  onRequestEntryGate?: () => void;
  showEntryGate?: boolean;
  signedOutNotice?: boolean;
}): ReactElement {
  const session = useMemberSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [onboardingRole, setOnboardingRole] = useState<OnboardingRole | null>(null);
  const [gameStudioPath, setGameStudioPath] = useState<GameStudioPath | null>(null);

  function beginSignupFlow(): void {
    clearMemberSession();
    clearSignedOut();
    setShowRoleSelector(true);
    setShowOnboarding(false);
    setOnboardingRole(null);
    setGameStudioPath(null);
  }

  function openEntryGate(): void {
    props.onRequestEntryGate?.();
  }

  useEffect(() => {
    const zkSession = getZkLoginSession();

    if (!zkSession) {
      return;
    }

    const restored = restoreMemberSessionByZkLoginAddress(zkSession.address);

    if (restored) {
      clearSignedOut();
    }
  }, []);

  function handleRoleSelection(role: OnboardingRole): void {
    setOnboardingRole(role);
    setShowRoleSelector(false);
    setGameStudioPath(null);

    if (role === 'game') {
      setShowOnboarding(false);
      return;
    }

    setShowOnboarding(true);
  }

  function resetOnboardingFlow(): void {
    setShowOnboarding(false);
    setShowRoleSelector(false);
    setOnboardingRole(null);
    setGameStudioPath(null);
  }

  function closeEntryGate(): void {
    props.onEntryGateHandled?.();
  }

  const entryGateOverlay = props.showEntryGate ? (
    <div
      aria-labelledby="nami-entry-gate-title"
      aria-modal="true"
      className="nami-entry-gate-overlay"
      role="dialog"
    >
      <EntryGatePanel
        onClose={closeEntryGate}
        onEnterHub={props.onEnterHub}
        onStartSignup={beginSignupFlow}
        {...(props.onNavigateToSettings
          ? { onNavigateToSettings: props.onNavigateToSettings }
          : {})}
      />
    </div>
  ) : null;

  if (showRoleSelector) {
    return (
      <>
        <div className="nami-entry-onboarding-shell">
          <header className="page-title nami-entry-onboarding-title">
            <p>Welcome to Nami</p>
            <h1>Choose your path</h1>
          </header>

          <OnboardingRoleSelector onSelect={handleRoleSelection} />

          <button
            className="secondary-action entry-back-button"
            onClick={resetOnboardingFlow}
            type="button"
          >
            Back to overview
          </button>
        </div>
        {entryGateOverlay}
      </>
    );
  }

  if (onboardingRole === 'game' && gameStudioPath === null && !showRoleSelector) {
    return (
      <>
        <div className="nami-entry-onboarding-shell">
          <header className="page-title nami-entry-onboarding-title">
            <p>Game studio onboarding</p>
            <h1>Choose your studio path</h1>
          </header>

          <GameStudioPathSelector
            onSelect={(path) => {
              setGameStudioPath(path);
              setShowOnboarding(true);
            }}
          />

          <button
            className="secondary-action entry-back-button"
            onClick={() => {
              setOnboardingRole(null);
              setShowRoleSelector(true);
            }}
            type="button"
          >
            Back to role selection
          </button>

          <button
            className="secondary-action entry-back-button"
            onClick={resetOnboardingFlow}
            type="button"
          >
            Back to overview
          </button>
        </div>
        {entryGateOverlay}
      </>
    );
  }

  if (showOnboarding && onboardingRole === 'game' && gameStudioPath === 'new-game') {
    return (
      <>
        <div className="nami-entry-onboarding-shell">
          <header className="page-title nami-entry-onboarding-title">
            <p>Game studio onboarding</p>
            <h1>Submit your game</h1>
          </header>

          <GameOnboardingPanel
            onBack={() => {
              setShowOnboarding(false);
              setGameStudioPath(null);
            }}
            onEnterPreApprovedChannel={() => {
              props.onEnterPreApprovedGame?.();
            }}
          />

          <button
            className="secondary-action entry-back-button"
            onClick={resetOnboardingFlow}
            type="button"
          >
            Back to overview
          </button>
        </div>
        {entryGateOverlay}
      </>
    );
  }

  if (showOnboarding && onboardingRole === 'game' && gameStudioPath === 'claim-channel') {
    return (
      <>
        <div className="nami-entry-onboarding-shell">
          <header className="page-title nami-entry-onboarding-title">
            <p>Game studio onboarding</p>
            <h1>Claim your channel</h1>
          </header>

          <GameChannelClaimPanel
            onBack={() => {
              setShowOnboarding(false);
              setGameStudioPath(null);
            }}
          />

          <button
            className="secondary-action entry-back-button"
            onClick={resetOnboardingFlow}
            type="button"
          >
            Back to overview
          </button>
        </div>
        {entryGateOverlay}
      </>
    );
  }

  if (showOnboarding && onboardingRole === 'gamer') {
    return (
      <>
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

          <button
            className="secondary-action entry-back-button"
            onClick={() => {
              setShowOnboarding(false);
              setShowRoleSelector(true);
              setOnboardingRole(null);
            }}
            type="button"
          >
            Back to role selection
          </button>
        </div>
        {entryGateOverlay}
      </>
    );
  }

  if (hasActiveMemberSession() && session) {
    return (
      <>
        <section className="nami-entry-page panel nami-entry-returning">
          <div className="nami-entry-hero">
            <span className="mini-badge">Welcome back</span>
            <h1>Hi, {resolveMemberDisplayName('m1', session.displayName)}</h1>
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
        {entryGateOverlay}
      </>
    );
  }

  return (
    <>
      <LandingOverview
        onEnterNami={openEntryGate}
        {...(props.signedOutNotice ? { signedOutNotice: true } : {})}
      />
      {entryGateOverlay}
    </>
  );
}
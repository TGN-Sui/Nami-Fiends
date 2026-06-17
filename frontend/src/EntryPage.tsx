import { useEffect, useState, type ReactElement } from 'react';

import { AccountConnectSection } from './account-connect.js';
import { clearSignedOut, isSignedOut, useSignedOut } from './member-auth-store.js';
import {
  clearMemberSession,
  hasActiveMemberSession,
  useMemberSession,
} from './member-session-store.js';
import { OnboardingPanel } from './OnboardingPanel.js';
import { useProtocolOwner } from './wallet.js';

export function EntryPage(props: {
  onEnterHub: () => void;
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
  }, [signedOut, owner]);

  function startFreshSignup(): void {
    clearMemberSession();
    clearSignedOut();
    setShowOnboarding(true);
  }

  if (showOnboarding) {
    return (
      <>
        <header className="page-title">
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
      </>
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
      <section className="nami-entry-page panel">
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
    <section className="nami-entry-page panel">
      <div className="nami-entry-hero">
        <span className="mini-badge">Welcome</span>
        <h1>Nami is your gamer world</h1>
        <p>
          Nami is a portable identity, reputation, and community layer for players, channels,
          squads, and guilds. Carry your passport, badges, conduct standing, and memberships
          across games and communities — without feeling like a technical setup flow.
        </p>
      </div>

      <div className="nami-entry-feature-grid">
        <article>
          <strong>Passport & Badges</strong>
          <p>Earn, collect, and show proof-based identity across every channel you join.</p>
        </article>
        <article>
          <strong>Global & Genre Chats</strong>
          <p>Hang out in official lounges or jump into genre rooms sized by live activity.</p>
        </article>
        <article>
          <strong>Events & Guilds</strong>
          <p>Subscribe to channel and guild events, or host your own as an owner.</p>
        </article>
        <article>
          <strong>Safety & Conduct</strong>
          <p>Color signals, moderation tools, and appeals keep rooms playable and fair.</p>
        </article>
      </div>

      <div className="nami-entry-actions">
        <button className="primary-action" onClick={() => setShowOnboarding(true)} type="button">
          Enter Nami
        </button>
        <button className="secondary-action" onClick={props.onEnterHub} type="button">
          Browse as guest
        </button>
      </div>
    </section>
  );
}
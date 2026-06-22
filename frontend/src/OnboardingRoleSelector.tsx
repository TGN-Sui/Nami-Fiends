import type { ReactElement } from 'react';

export type OnboardingRole = 'gamer' | 'game';

export function OnboardingRoleSelector(props: {
  onSelect: (role: OnboardingRole) => void;
}): ReactElement {
  return (
    <section className="onboarding-role-selector panel">
      <header className="onboarding-role-selector-head">
        <span className="mini-badge">Enter Nami</span>
        <h2>Are you a gamer or a game?</h2>
        <p>
          Gamers create a passport and enter the hub. Games submit an official ticket to Nami
          Officials and unlock a pre-approved channel workspace when their Trust Score is high enough.
        </p>
      </header>

      <div className="onboarding-role-selector-grid">
        <button
          className="onboarding-role-card is-gamer-role"
          onClick={() => props.onSelect('gamer')}
          type="button"
        >
          <span className="onboarding-role-card-index">01</span>
          <strong>Gamer</strong>
          <p>Sign up with email, take the gamer quiz, and optionally verify socials for Player Score.</p>
        </button>

        <button
          className="onboarding-role-card is-game-role"
          onClick={() => props.onSelect('game')}
          type="button"
        >
          <span className="onboarding-role-card-index">02</span>
          <strong>Game</strong>
          <p>
            Submit a studio ticket with official X or Twitch, zkLogin sign-in, phone, and email. Trust
            Score 60%+ unlocks pre-approval.
          </p>
        </button>
      </div>
    </section>
  );
}
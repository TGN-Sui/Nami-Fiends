import type { ReactElement } from 'react';

export type GameStudioPath = 'new-game' | 'claim-channel';

export function GameStudioPathSelector(props: {
  onSelect: (path: GameStudioPath) => void;
}): ReactElement {
  return (
    <section className="onboarding-role-selector panel game-studio-path-selector">
      <header className="onboarding-role-selector-head">
        <span className="mini-badge">Game studio</span>
        <h2>Submit a new game or claim a channel</h2>
        <p>
          Nami Officials may create game channels ahead of onboarding. If your game already has a
          reserved channel, submit a claim ticket with valid proof. Otherwise start a new game ticket.
        </p>
      </header>

      <div className="onboarding-role-selector-grid">
        <button
          className="onboarding-role-card is-game-role"
          onClick={() => props.onSelect('new-game')}
          type="button"
        >
          <span className="onboarding-role-card-index">01</span>
          <strong>Submit new game</strong>
          <p>
            Full studio onboarding with official X or Twitch, zkLogin sign-in, Trust Score, and
            pre-approval when eligible.
          </p>
        </button>

        <button
          className="onboarding-role-card is-game-role"
          onClick={() => props.onSelect('claim-channel')}
          type="button"
        >
          <span className="onboarding-role-card-index">02</span>
          <strong>Claim existing channel</strong>
          <p>
            Pick an owner-provisioned channel, prove ownership, and wait for the Nami official owner
            to approve before keys hand over.
          </p>
        </button>
      </div>
    </section>
  );
}
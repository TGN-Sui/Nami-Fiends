import { useState, type ReactElement } from 'react';

import type { GameOfficialSocialPlatform } from './game-onboarding-draft.js';
import {
  authorizeGameOfficialTwitchAccount,
  authorizeGameOfficialXAccount,
  gameOfficialSocialAuthorizerStatusMessage,
  isGameOfficialSocialAuthorizerAvailable,
  unlinkGameOfficialSocialAuth,
  useGameOfficialSocialAuthState,
} from './game-official-social-auth-store.js';

export function GameOfficialSocialAuthControl(props: {
  gameTitle: string;
  platform: GameOfficialSocialPlatform;
}): ReactElement {
  const authState = useGameOfficialSocialAuthState();
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const platformMatches = authState.platform === props.platform;
  const isVerified = platformMatches && authState.verified && authState.handle !== null;
  const authorizerAvailable = isGameOfficialSocialAuthorizerAvailable(props.platform);
  const platformLabel = props.platform === 'x' ? 'X' : 'Twitch';
  const mockHandleSeed =
    props.gameTitle.trim().replace(/[^a-z0-9]+/gi, '').slice(0, 18).toLowerCase() || 'officialgame';

  function handleAuthorize(): void {
    setAuthNotice(null);
    setAuthError(null);

    const result =
      props.platform === 'x'
        ? authorizeGameOfficialXAccount(mockHandleSeed)
        : authorizeGameOfficialTwitchAccount(mockHandleSeed + 'channel');

    if (!result.ok) {
      setAuthError(result.reason);
      return;
    }

    setAuthNotice(result.message);
  }

  function handleUnlink(): void {
    setAuthNotice(null);
    setAuthError(null);

    const result = unlinkGameOfficialSocialAuth();

    if (!result.ok) {
      setAuthError(result.reason);
      return;
    }

    setAuthNotice(result.message);
  }

  return (
    <section className="game-official-social-auth-block panel">
      <header className="game-official-social-auth-head">
        <span className="mini-badge">Required</span>
        <h3>Official {platformLabel} authorization</h3>
        <p>{gameOfficialSocialAuthorizerStatusMessage(props.platform)}</p>
      </header>

      <div className="game-official-social-auth-status">
        {isVerified ? (
          <>
            <strong>
              {props.platform === 'x' ? '@' + authState.handle : authState.handle}
            </strong>
            <span>
              Verified via {props.platform === 'x' ? 'X' : 'Twitch'} official authorizer
            </span>
          </>
        ) : (
          <span>
            Sign in with your official game {platformLabel} account to continue. Manual handle entry
            is not accepted.
          </span>
        )}
      </div>

      <div className="game-official-social-auth-actions">
        {isVerified ? (
          <button className="secondary-action" onClick={handleUnlink} type="button">
            Unlink {platformLabel} account
          </button>
        ) : authorizerAvailable ? (
          <button className="primary-action" onClick={handleAuthorize} type="button">
            {props.platform === 'x' ? 'Sign in with X' : 'Sign in with Twitch'}
          </button>
        ) : (
          <p className="protocol-hint">
            The official {platformLabel} authorizer is not configured in this environment yet.
          </p>
        )}
      </div>

      {authNotice ? <p className="protocol-hint">{authNotice}</p> : null}
      {authError ? <p className="onboarding-field-error">{authError}</p> : null}
    </section>
  );
}
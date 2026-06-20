import { useState, type ReactElement } from 'react';

import {
  authorizeGameOfficialTwitchAccount,
  authorizeGameOfficialXAccount,
  authorizeGamerOfficialTwitchAccount,
  authorizeGamerOfficialXAccount,
  isGameOfficialSocialVerified,
  isGamerOfficialSocialVerified,
  isOfficialSocialAuthorizerAvailable,
  officialSocialAuthorizerStatusMessage,
  unlinkGameOfficialSocialAuth,
  unlinkGamerOfficialSocialAuth,
  useGameScopedOfficialSocialAuthState,
  useGamerScopedOfficialSocialAuthState,
  type OfficialSocialAuthScope,
  type OfficialSocialPlatform,
} from './official-social-auth-store.js';

export function OfficialSocialAuthControl(props: {
  scope: OfficialSocialAuthScope;
  platform: OfficialSocialPlatform;
  mockHandleSeed: string;
  required?: boolean;
}): ReactElement {
  const gameAuthState = useGameScopedOfficialSocialAuthState();
  const gamerAuthState = useGamerScopedOfficialSocialAuthState();
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const platformLabel = props.platform === 'x' ? 'X' : 'Twitch';
  const authorizerAvailable = isOfficialSocialAuthorizerAvailable(props.platform);
  const mockHandleSeed =
    props.mockHandleSeed.trim().replace(/[^a-z0-9]+/gi, '').slice(0, 18).toLowerCase() ||
    (props.scope === 'game' ? 'officialgame' : 'npcgamer');

  const isVerified =
    props.scope === 'game'
      ? isGameOfficialSocialVerified(props.platform)
      : isGamerOfficialSocialVerified(props.platform);

  const verifiedHandle =
    props.scope === 'game'
      ? gameAuthState.platform === props.platform
        ? gameAuthState.handle
        : null
      : gamerAuthState[props.platform].handle;

  const accountLabel = props.scope === 'game' ? 'official game ' : '';

  function handleAuthorize(): void {
    setAuthNotice(null);
    setAuthError(null);

    const result =
      props.scope === 'game'
        ? props.platform === 'x'
          ? authorizeGameOfficialXAccount(mockHandleSeed)
          : authorizeGameOfficialTwitchAccount(mockHandleSeed + 'channel')
        : props.platform === 'x'
          ? authorizeGamerOfficialXAccount(mockHandleSeed)
          : authorizeGamerOfficialTwitchAccount(mockHandleSeed + 'channel');

    if (!result.ok) {
      setAuthError(result.reason);
      return;
    }

    setAuthNotice(result.message);
  }

  function handleUnlink(): void {
    setAuthNotice(null);
    setAuthError(null);

    const result =
      props.scope === 'game'
        ? unlinkGameOfficialSocialAuth()
        : unlinkGamerOfficialSocialAuth(props.platform);

    if (!result.ok) {
      setAuthError(result.reason);
      return;
    }

    setAuthNotice(result.message);
  }

  return (
    <section className="game-official-social-auth-block panel">
      <header className="game-official-social-auth-head">
        <span className="mini-badge">{props.required ? 'Required' : 'Optional'}</span>
        <h3>
          {props.scope === 'game' ? 'Official ' : ''}
          {platformLabel} authorization
        </h3>
        <p>{officialSocialAuthorizerStatusMessage(props.scope, props.platform)}</p>
      </header>

      <div className="game-official-social-auth-status">
        {isVerified && verifiedHandle ? (
          <>
            <strong>
              {props.platform === 'x' ? '@' + verifiedHandle : verifiedHandle}
            </strong>
            <span>
              Verified via {platformLabel} official authorizer
            </span>
          </>
        ) : (
          <span>
            Sign in with your {accountLabel}
            {platformLabel} account{props.scope === 'game' ? ' to continue' : ' to boost Player Score'}.
            Manual handle entry is not accepted.
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
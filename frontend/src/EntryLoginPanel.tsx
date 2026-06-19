import { useEffect, useState, type ReactElement } from 'react';

import { clearSignedOut } from './member-auth-store.js';
import {
  linkMemberSessionAuth,
  restoreMemberSessionByEmail,
  restoreMemberSessionByLinkedOwner,
  restoreMemberSessionByXHandle,
} from './member-auth-link-store.js';

import {
  authorizeXAccount,
  isXVerificationMockEnabled,
  useXVerificationState,
} from './x-verification-store.js';
import {
  useProtocolOwner,
  WalletConnectControl,
  ZkLoginConnectControl,
} from './wallet.js';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function EntryLoginPanel(props: {
  onBack: () => void;
  onLoginSuccess: () => void;
}): ReactElement {
  const { owner, source } = useProtocolOwner();
  const xVerification = useXVerificationState();
  const [email, setEmail] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailPending, setEmailPending] = useState(false);

  useEffect(() => {
    if (!owner || (source !== 'wallet' && source !== 'zklogin')) {
      return;
    }

    const restored = restoreMemberSessionByLinkedOwner(owner, source);

    if (!restored) {
      setLoginError(
        'No Nami account is linked to this ' +
          (source === 'zklogin' ? 'Google / zkLogin' : 'wallet') +
          ' sign-in yet. Sign up first, then link methods in Settings.',
      );
      return;
    }

    linkMemberSessionAuth(restored, {
      email: restored.email,
      zkLoginAddress: source === 'zklogin' ? owner : null,
      walletAddress: source === 'wallet' ? owner : null,
    });
    clearSignedOut();
    props.onLoginSuccess();
  }, [owner, source, props.onLoginSuccess]);

  function handleEmailSignIn(): void {
    setLoginError(null);

    if (!isValidEmail(email)) {
      setLoginError('Enter the email you used during signup.');
      return;
    }

    setEmailPending(true);

    const restored = restoreMemberSessionByEmail(email);

    setEmailPending(false);

    if (!restored) {
      setLoginError('No account found for that email. Sign up to create a Nami passport.');
      return;
    }

    linkMemberSessionAuth(restored, { email: restored.email });
    clearSignedOut();
    props.onLoginSuccess();
  }

  function handleXSignIn(): void {
    setLoginError(null);

    const handle = xHandle.trim() || xVerification.handle?.replace(/^@+/, '') || '';

    if (handle.length < 2) {
      setLoginError('Enter your linked X handle or authorize through X first.');
      return;
    }

    if (!xVerification.verified) {
      const result = authorizeXAccount(handle);

      if (!result.ok) {
        setLoginError(result.reason);
        return;
      }
    }

    const restored = restoreMemberSessionByXHandle(handle);

    if (!restored) {
      setLoginError('No Nami account is linked to that X handle yet. Sign up and link X in Settings.');
      return;
    }

    linkMemberSessionAuth(restored, {
      email: restored.email,
      xHandle: handle,
    });
    clearSignedOut();
    props.onLoginSuccess();
  }

  return (
    <div className="nami-entry-login-panel">
      <div className="nami-entry-gate-copy">
        <span className="mini-badge">Log in</span>
        <h2 id="nami-entry-gate-title">Sign in with your linked account</h2>
        <p>
          Use Google (zkLogin), email, X, or your wallet. Every method links to the same Nami wallet
          identity — connect with any method you used during signup.
        </p>
      </div>

      <div className="nami-entry-login-methods">
        <section className="nami-entry-login-block">
          <span className="nami-entry-login-label">Google via zkLogin</span>
          <ZkLoginConnectControl />
        </section>

        <section className="nami-entry-login-block">
          <span className="nami-entry-login-label">Email</span>
          <label className="onboarding-field">
            <span>Signup email</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>
          <button
            className="secondary-action"
            disabled={emailPending || !isValidEmail(email)}
            onClick={handleEmailSignIn}
            type="button"
          >
            {emailPending ? 'Checking…' : 'Continue with email'}
          </button>
        </section>

        <section className="nami-entry-login-block">
          <span className="nami-entry-login-label">X account</span>
          <label className="onboarding-field">
            <span>X handle</span>
            <input
              onChange={(event) => setXHandle(event.target.value)}
              placeholder="@yourhandle"
              type="text"
              value={xHandle}
            />
          </label>
          <button className="secondary-action" onClick={handleXSignIn} type="button">
            {xVerification.verified ? 'Sign in with linked X' : 'Authorize & sign in with X'}
          </button>
          {!isXVerificationMockEnabled() ? (
            <small className="protocol-hint">
              Live X OAuth ships soon. Use Google, email, or wallet until then.
            </small>
          ) : null}
        </section>

        <section className="nami-entry-login-block">
          <span className="nami-entry-login-label">Wallet</span>
          <p className="protocol-hint">
            Connect the wallet you linked during signup to recover your account.
          </p>
          <WalletConnectControl />
        </section>
      </div>

      {loginError ? <p className="nami-entry-gate-error">{loginError}</p> : null}

      <div className="nami-entry-gate-actions">
        <button className="secondary-action" onClick={props.onBack} type="button">
          Back
        </button>
      </div>
    </div>
  );
}
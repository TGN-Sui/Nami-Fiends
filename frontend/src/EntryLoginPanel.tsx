import { useEffect, useState, type ReactElement } from 'react';

import { ContactCodeVerificationControl } from './ContactCodeVerificationControl.js';
import {
  isContactVerified,
  isContactVerificationAvailable,
} from './contact-code-verification-store.js';
import { memberHasPasswordCredential } from './member-credential-store.js';
import { authenticateMemberCredentials } from './member-session-store.js';
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
  const [emailVerified, setEmailVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailPending, setEmailPending] = useState(false);
  const emailVerificationRequired = isContactVerificationAvailable();

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

    if (emailVerificationRequired && !isContactVerified('email', email)) {
      setLoginError('Verify your email with the one-time code before signing in.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordRequired = memberHasPasswordCredential(normalizedEmail);

    if (passwordRequired && password.trim().length === 0) {
      setLoginError('Enter the password you created during signup.');
      return;
    }

    setEmailPending(true);

    const restored = passwordRequired
      ? authenticateMemberCredentials(normalizedEmail, password)
      : restoreMemberSessionByEmail(email);

    setEmailPending(false);

    if (!restored) {
      setLoginError(
        passwordRequired
          ? 'Incorrect email or password.'
          : 'No account found for that email. Sign up to create a Nami passport.'
      );
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
          <ContactCodeVerificationControl
            autoComplete="email"
            channel="email"
            inputType="email"
            label="Signup email"
            onChange={setEmail}
            onVerifiedChange={setEmailVerified}
            placeholder="you@example.com"
            value={email}
            verified={emailVerified}
          />
          <label className="onboarding-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your signup password"
              type="password"
              value={password}
            />
          </label>

          <button
            className="secondary-action"
            disabled={
              emailPending ||
              !isValidEmail(email) ||
              (emailVerificationRequired && !emailVerified)
            }
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
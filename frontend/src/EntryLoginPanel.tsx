import { useEffect, useState, type ReactElement } from 'react';

import { ContactCodeVerificationControl } from './ContactCodeVerificationControl.js';
import {
  isContactVerified,
  isContactVerificationAvailable,
} from './contact-code-verification-store.js';
import { memberHasPasswordCredential } from './member-credential-store.js';
import {
  authenticateMemberCredentials,
  hasRegisteredMemberAccount,
} from './member-session-store.js';
import { clearSignedOut } from './member-auth-store.js';
import {
  linkMemberSessionAuth,
  restoreMemberSessionAfterZkLogin,
  restoreMemberSessionByEmail,
  restoreMemberSessionByXHandle,
} from './member-auth-link-store.js';
import { isOfficialOwner } from './nami-capabilities.js';

import {
  authorizeXAccount,
  isXVerificationMockEnabled,
  useXVerificationState,
} from './x-verification-store.js';
import {
  recoveryEmailOnboardingHint,
  zkLoginAccountLinkHint,
} from './onboarding-recovery.js';
import { hydrateLinkedMember } from './linked-member-sync.js';
import type { NamiLinkedProfile } from './nami-linked-profile-api.js';
import { getZkLoginSession } from './zklogin.js';
import { useProtocolOwner, ZkLoginConnectControl } from './wallet.js';

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
  const [zkPassportDiscovery, setZkPassportDiscovery] = useState<NamiLinkedProfile | null>(null);
  const [zkDiscoveryPending, setZkDiscoveryPending] = useState(false);
  const emailVerificationRequired = isContactVerificationAvailable();

  useEffect(() => {
    if (!owner || source !== 'zklogin') {
      setZkPassportDiscovery(null);
      setZkDiscoveryPending(false);
      return;
    }

    let cancelled = false;
    setZkDiscoveryPending(true);

    void hydrateLinkedMember(owner, source)
      .then((profile) => {
        if (cancelled) {
          return;
        }

        setZkPassportDiscovery(profile?.proof.status === 'verified' ? profile : null);
      })
      .finally(() => {
        if (!cancelled) {
          setZkDiscoveryPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [owner, source]);

  useEffect(() => {
    const zkSession = getZkLoginSession();
    const zkOwner = zkSession?.address ?? null;
    const officialOwner = isOfficialOwner(zkOwner);

    if (!zkOwner) {
      return;
    }

    if (!officialOwner && (source !== 'zklogin' || zkDiscoveryPending)) {
      return;
    }

    const restored = restoreMemberSessionAfterZkLogin(zkOwner);

    if (!restored && !officialOwner) {
      if (zkPassportDiscovery) {
        const nodename = zkPassportDiscovery.anchor.nodename ?? 'passport';

        setLoginError(
          `${nodename} is on this zkLogin wallet. Sign in with the email from your claim, or sign up to link it.`
        );
      } else {
        setLoginError(zkLoginAccountLinkHint());
      }

      return;
    }

    clearSignedOut();
    props.onLoginSuccess();
  }, [owner, source, zkDiscoveryPending, zkPassportDiscovery, props]);

  function handleEmailSignIn(): void {
    setLoginError(null);

    if (!isValidEmail(email)) {
      setLoginError('Enter the email you used during signup.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const returningAccount =
      memberHasPasswordCredential(normalizedEmail) || hasRegisteredMemberAccount(email);

    if (
      emailVerificationRequired &&
      !isContactVerified('email', email) &&
      !returningAccount
    ) {
      setLoginError('Verify your email with the one-time code before signing in.');
      return;
    }
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

    const zkSession = getZkLoginSession();

    linkMemberSessionAuth(restored, {
      email: restored.email,
      ...(zkSession ? { zkLoginAddress: zkSession.address } : {}),
    });
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
      <header className="nami-entry-login-intro">
        <span className="mini-badge">Log in</span>
        <h2 id="nami-entry-gate-title">Sign in with your linked account</h2>
        <p className="nami-entry-login-lead">
          Pick the method you used at signup — every path links to the same Nami passport.
        </p>
      </header>

      <div className="nami-entry-login-methods">
        <section className="nami-entry-login-method nami-entry-login-method-primary">
          <div className="nami-entry-login-method-copy">
            <h3 className="nami-entry-login-label">Google via zkLogin</h3>
            <p className="nami-entry-login-method-desc">
              One-tap sign-in when you linked Google during signup.
            </p>
          </div>
          <ZkLoginConnectControl />
          {zkDiscoveryPending ? (
            <p className="nami-entry-login-footnote">Checking this wallet for an existing Nami passport…</p>
          ) : null}
          {zkPassportDiscovery ? (
            <div className="nami-entry-passport-discovery panel">
              <span className="mini-badge">Passport found</span>
              <p>
                <strong>{zkPassportDiscovery.anchor.nodename ?? 'Your nodename'}</strong> is anchored to
                this zkLogin wallet. Integrated platforms can recognize you without a new claim.
              </p>
            </div>
          ) : null}
          <p className="nami-entry-login-footnote">{recoveryEmailOnboardingHint()}</p>
        </section>

        <div aria-hidden="true" className="nami-entry-login-or">
          <span>or</span>
        </div>

        <section className="nami-entry-login-method">
          <div className="nami-entry-login-method-copy">
            <h3 className="nami-entry-login-label">Email</h3>
            <p className="nami-entry-login-method-desc">Use the email and password from signup.</p>
          </div>
          <div className="nami-entry-login-method-fields">
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
              className="secondary-action nami-entry-login-method-submit"
              disabled={
                emailPending ||
                !isValidEmail(email) ||
                (emailVerificationRequired &&
                  !emailVerified &&
                  !memberHasPasswordCredential(email.trim().toLowerCase()) &&
                  !hasRegisteredMemberAccount(email))
              }
              onClick={handleEmailSignIn}
              type="button"
            >
              {emailPending ? 'Checking…' : 'Continue with email'}
            </button>
          </div>
        </section>

        <section className="nami-entry-login-method">
          <div className="nami-entry-login-method-copy">
            <h3 className="nami-entry-login-label">X account</h3>
            <p className="nami-entry-login-method-desc">
              Sign in with the X handle you linked in Settings.
            </p>
          </div>
          <div className="nami-entry-login-method-fields">
            <label className="onboarding-field">
              <span>X handle</span>
              <input
                onChange={(event) => setXHandle(event.target.value)}
                placeholder="@yourhandle"
                type="text"
                value={xHandle}
              />
            </label>
            <button
              className="secondary-action nami-entry-login-method-submit"
              onClick={handleXSignIn}
              type="button"
            >
              {xVerification.verified ? 'Sign in with linked X' : 'Authorize & sign in with X'}
            </button>
            {!isXVerificationMockEnabled() ? (
              <p className="nami-entry-login-footnote">
                Live X OAuth ships soon. Use Google or email until then.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {loginError ? <p className="nami-entry-gate-error">{loginError}</p> : null}

      <div className="nami-entry-gate-actions nami-entry-login-back-actions">
        <button className="secondary-action" onClick={props.onBack} type="button">
          Back
        </button>
      </div>
    </div>
  );
}
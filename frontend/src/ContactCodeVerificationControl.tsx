import { useState, type ReactElement } from 'react';

import {
  clearContactVerificationForChannel,
  contactVerificationStatusMessage,
  syncContactVerificationTarget,
  isContactVerificationAvailable,
  isContactVerified,
  isValidContactEmail,
  isValidContactPhone,
  normalizeContactEmail,
  normalizeContactPhone,
  readContactCodeVerificationState,
  sendContactVerificationCode,
  useContactCodeVerificationState,
  verifyContactCode,
  type ContactVerificationChannel,
} from './contact-code-verification-store.js';

export function ContactCodeVerificationControl(props: {
  channel: ContactVerificationChannel;
  label: string;
  value: string;
  onChange: (value: string) => void;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  placeholder: string;
  autoComplete: string;
  inputType: 'email' | 'tel';
  optionalHint?: string;
}): ReactElement {
  const verificationState = useContactCodeVerificationState();
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedValue =
    props.channel === 'email'
      ? normalizeContactEmail(props.value)
      : normalizeContactPhone(props.value);
  const hasValue = normalizedValue.length > 0;
  const formatValid =
    props.channel === 'email'
      ? isValidContactEmail(props.value)
      : isValidContactPhone(props.value);
  const verifiedForValue = isContactVerified(props.channel, props.value);
  const pending =
    props.channel === 'email'
      ? verificationState.emailPending
      : verificationState.phonePending;
  const codeSent = pending?.target === normalizedValue && pending.codeSent;
  const verificationAvailable = isContactVerificationAvailable();

  function handleValueChange(nextValue: string): void {
    setNotice(null);
    setError(null);

    const nextNormalized =
      props.channel === 'email'
        ? normalizeContactEmail(nextValue)
        : normalizeContactPhone(nextValue);
    const stillVerified = isContactVerified(props.channel, nextValue);

    const verificationSnapshot = readContactCodeVerificationState();
    const currentPending =
      props.channel === 'email'
        ? verificationSnapshot.emailPending
        : verificationSnapshot.phonePending;

    props.onChange(nextValue);
    props.onVerifiedChange(stillVerified && nextNormalized.length > 0);
    syncContactVerificationTarget(props.channel, nextValue);

    if (currentPending?.target !== nextNormalized) {
      setCode('');
    }
  }

  function handleSendCode(): void {
    setNotice(null);
    setError(null);

    const result = sendContactVerificationCode(props.channel, props.value);

    if (!result.ok) {
      setError(result.reason);
      return;
    }

    setNotice(result.message);
  }

  function handleVerifyCode(): void {
    setNotice(null);
    setError(null);

    const result = verifyContactCode(props.channel, props.value, code);

    if (!result.ok) {
      setError(result.reason);
      return;
    }

    props.onVerifiedChange(true);
    setCode('');
    setNotice(result.message);
  }

  function handleClearVerification(): void {
    setNotice(null);
    setError(null);
    setCode('');

    const result = clearContactVerificationForChannel(props.channel);

    if (!result.ok) {
      setError(result.reason);
      return;
    }

    props.onVerifiedChange(false);
    setNotice(result.message);
  }

  return (
    <div className="contact-code-verification-field">
      <label className="onboarding-field">
        <span>{props.label}</span>
        <input
          autoComplete={props.autoComplete}
          onChange={(event) => handleValueChange(event.target.value)}
          placeholder={props.placeholder}
          type={props.inputType}
          value={props.value}
        />
        {hasValue && !formatValid ? (
          <small className="onboarding-field-error">
            {props.channel === 'email'
              ? 'Enter a valid email address.'
              : 'Enter a valid phone number.'}
          </small>
        ) : props.optionalHint ? (
          <small className="protocol-hint">{props.optionalHint}</small>
        ) : null}
      </label>

      {hasValue ? (
        <section className="contact-code-verification-block panel">
          <header className="contact-code-verification-head">
            <span className="mini-badge">{verifiedForValue ? 'Verified' : 'Required'}</span>
            <h4>
              {props.channel === 'email' ? 'Email code verification' : 'SMS code verification'}
            </h4>
            <p>{contactVerificationStatusMessage(props.channel)}</p>
          </header>

          {verifiedForValue ? (
            <div className="contact-code-verification-status">
              <strong>{normalizedValue}</strong>
              <span>
                {props.channel === 'email'
                  ? 'Verified via email code'
                  : 'Verified via SMS code'}
              </span>
            </div>
          ) : (
            <p className="protocol-hint">
              Enter the code sent to {normalizedValue} to continue. You cannot proceed with an
              unverified {props.channel === 'email' ? 'email' : 'phone number'}.
            </p>
          )}

          <div className="contact-code-verification-actions">
            {verifiedForValue ? (
              <button className="secondary-action" onClick={handleClearVerification} type="button">
                Change {props.channel === 'email' ? 'email' : 'number'}
              </button>
            ) : verificationAvailable ? (
              <>
                <button
                  className="secondary-action"
                  disabled={!formatValid || codeSent}
                  onClick={handleSendCode}
                  type="button"
                >
                  {codeSent ? 'Code sent' : 'Send code'}
                </button>
                {codeSent ? (
                  <label className="onboarding-field contact-code-verification-code-field">
                    <span>Verification code</span>
                    <input
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={8}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Enter code"
                      type="text"
                      value={code}
                    />
                  </label>
                ) : null}
                {codeSent ? (
                  <button
                    className="primary-action"
                    disabled={code.trim().length < 4}
                    onClick={handleVerifyCode}
                    type="button"
                  >
                    Verify code
                  </button>
                ) : null}
              </>
            ) : (
              <p className="protocol-hint">
                Verification delivery is not configured in this environment yet.
              </p>
            )}
          </div>

          {notice ? <p className="protocol-hint">{notice}</p> : null}
          {error ? <p className="onboarding-field-error">{error}</p> : null}
        </section>
      ) : null}

      {hasValue && !verifiedForValue && !props.verified ? (
        <p className="onboarding-field-error contact-code-verification-blocker">
          Continue stays disabled until this {props.channel === 'email' ? 'email' : 'phone number'}{' '}
          is verified or cleared.
        </p>
      ) : null}
    </div>
  );
}
import { useSyncExternalStore } from 'react';

import { isTestLaunchMode, shouldUseDevFixtures } from './app-config.js';

const STORAGE_KEY = 'nami.contact-code-verification';
const DEV_VERIFICATION_CODE = '123456';

export type ContactVerificationChannel = 'email' | 'phone';

export type ContactVerificationResult =
  | { ok: true; message: string }
  | { ok: false; reason: string };

type PendingVerification = {
  target: string;
  codeSent: boolean;
  codeSentAtMs: number | null;
};

type VerifiedContact = {
  target: string;
  verifiedAtMs: number;
};

export type ContactCodeVerificationState = {
  emailPending: PendingVerification | null;
  phonePending: PendingVerification | null;
  emailVerified: VerifiedContact | null;
  phoneVerified: VerifiedContact | null;
};

let cachedState: ContactCodeVerificationState | null = null;

const listeners = new Set<() => void>();

function defaultState(): ContactCodeVerificationState {
  return {
    emailPending: null,
    phonePending: null,
    emailVerified: null,
    phoneVerified: null,
  };
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function invalidate(): void {
  cachedState = null;
}

export function normalizeContactEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeContactPhone(value: string): string {
  return value.trim();
}

export function isValidContactEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeContactEmail(value));
}

export function isValidContactPhone(value: string): boolean {
  return /^\+?[\d\s().-]{7,}$/.test(normalizeContactPhone(value));
}

function normalizeContactTarget(channel: ContactVerificationChannel, value: string): string {
  return channel === 'email' ? normalizeContactEmail(value) : normalizeContactPhone(value);
}

function getVerifiedContact(
  state: ContactCodeVerificationState,
  channel: ContactVerificationChannel,
): VerifiedContact | null {
  return channel === 'email' ? state.emailVerified : state.phoneVerified;
}

function getPendingContact(
  state: ContactCodeVerificationState,
  channel: ContactVerificationChannel,
): PendingVerification | null {
  return channel === 'email' ? state.emailPending : state.phonePending;
}

function saveState(state: ContactCodeVerificationState): void {
  cachedState = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nami-contact-code-verification-changed'));
  emit();
}

export function readContactCodeVerificationState(): ContactCodeVerificationState {
  if (cachedState) {
    return cachedState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedState = defaultState();
      return cachedState;
    }

    const parsed = JSON.parse(stored) as Partial<ContactCodeVerificationState>;

    cachedState = {
      emailPending: parsed.emailPending ?? null,
      phonePending: parsed.phonePending ?? null,
      emailVerified: parsed.emailVerified ?? null,
      phoneVerified: parsed.phoneVerified ?? null,
    };

    return cachedState;
  } catch {
    cachedState = defaultState();
    return cachedState;
  }
}

export function clearContactCodeVerification(): void {
  saveState(defaultState());
}

export function isContactVerificationMockEnabled(): boolean {
  return shouldUseDevFixtures();
}

export function isContactVerificationAvailable(): boolean {
  return isContactVerificationMockEnabled() || isTestLaunchMode();
}

export function contactVerificationTestnetCodeHint(): string | null {
  if (!isTestLaunchMode() || isContactVerificationMockEnabled()) {
    return null;
  }

  return 'Testnet: email/SMS delivery is not live yet. Tap Send code, then enter 123456 to verify.';
}

export function contactVerificationStatusMessage(channel: ContactVerificationChannel): string {
  const testnetHint = contactVerificationTestnetCodeHint();

  if (testnetHint) {
    return testnetHint;
  }

  if (isContactVerificationAvailable()) {
    return channel === 'email'
      ? 'We will email a one-time code to confirm you own this address.'
      : 'We will text a one-time code to confirm you own this number.';
  }

  return channel === 'email'
    ? 'Email verification ships with the live delivery service. Enable dev fixtures to test locally.'
    : 'SMS verification ships with the live delivery service. Enable dev fixtures to test locally.';
}

export function isContactVerified(channel: ContactVerificationChannel, value: string): boolean {
  const target = normalizeContactTarget(channel, value);
  const verified = getVerifiedContact(readContactCodeVerificationState(), channel);

  if (!verified || target.length === 0) {
    return false;
  }

  return verified.target === target;
}

export function contactFieldBlocksContinue(value: string, verified: boolean): boolean {
  return value.trim().length > 0 && !verified;
}

export function sendContactVerificationCode(
  channel: ContactVerificationChannel,
  value: string,
): ContactVerificationResult {
  if (!isContactVerificationAvailable()) {
    return {
      ok: false,
      reason:
        channel === 'email'
          ? 'Email verification is not available yet. Enable dev fixtures or wait for the live service.'
          : 'SMS verification is not available yet. Enable dev fixtures or wait for the live service.',
    };
  }

  const target = normalizeContactTarget(channel, value);
  const valid =
    channel === 'email' ? isValidContactEmail(target) : isValidContactPhone(target);

  if (!valid) {
    return {
      ok: false,
      reason:
        channel === 'email'
          ? 'Enter a valid email address before requesting a code.'
          : 'Enter a valid phone number before requesting a code.',
    };
  }

  const state = readContactCodeVerificationState();
  const pending: PendingVerification = {
    target,
    codeSent: true,
    codeSentAtMs: Date.now(),
  };

  saveState({
    ...state,
    emailPending: channel === 'email' ? pending : state.emailPending,
    phonePending: channel === 'phone' ? pending : state.phonePending,
    emailVerified: channel === 'email' ? null : state.emailVerified,
    phoneVerified: channel === 'phone' ? null : state.phoneVerified,
  });

  const destination = channel === 'email' ? target : target;
  const testnetHint = contactVerificationTestnetCodeHint();
  const devHint = isContactVerificationMockEnabled()
    ? ' Use code ' + DEV_VERIFICATION_CODE + ' in dev.'
    : testnetHint
      ? ' Enter code ' + DEV_VERIFICATION_CODE + ' on testnet (delivery not wired yet).'
      : '';

  return {
    ok: true,
    message: (testnetHint ? 'Verification ready for ' : 'Code sent to ') + destination + '.' + devHint,
  };
}

export function verifyContactCode(
  channel: ContactVerificationChannel,
  value: string,
  code: string,
): ContactVerificationResult {
  if (!isContactVerificationAvailable()) {
    return {
      ok: false,
      reason: 'Verification is not available in this environment yet.',
    };
  }

  const target = normalizeContactTarget(channel, value);
  const trimmedCode = code.trim();

  if (trimmedCode.length < 4) {
    return { ok: false, reason: 'Enter the verification code sent to you.' };
  }

  const state = readContactCodeVerificationState();
  const pending = getPendingContact(state, channel);

  if (!pending?.codeSent || pending.target !== target) {
    return { ok: false, reason: 'Request a verification code for this ' + channel + ' first.' };
  }

  if (trimmedCode !== DEV_VERIFICATION_CODE) {
    return { ok: false, reason: 'That code did not match. Check the message and try again.' };
  }

  const verified: VerifiedContact = {
    target,
    verifiedAtMs: Date.now(),
  };

  saveState({
    ...state,
    emailPending: channel === 'email' ? null : state.emailPending,
    phonePending: channel === 'phone' ? null : state.phonePending,
    emailVerified: channel === 'email' ? verified : state.emailVerified,
    phoneVerified: channel === 'phone' ? verified : state.phoneVerified,
  });

  return {
    ok: true,
    message:
      channel === 'email'
        ? target + ' verified through email code confirmation.'
        : target + ' verified through SMS code confirmation.',
  };
}

export function syncContactVerificationTarget(
  channel: ContactVerificationChannel,
  value: string,
): void {
  const target = normalizeContactTarget(channel, value);
  const state = readContactCodeVerificationState();
  const verified = getVerifiedContact(state, channel);
  const pending = getPendingContact(state, channel);

  const verifiedMismatch = verified !== null && verified.target !== target;
  const pendingMismatch = pending !== null && pending.target !== target;

  if (!verifiedMismatch && !pendingMismatch) {
    return;
  }

  saveState({
    ...state,
    emailPending:
      channel === 'email' && pendingMismatch ? null : state.emailPending,
    phonePending:
      channel === 'phone' && pendingMismatch ? null : state.phonePending,
    emailVerified:
      channel === 'email' && verifiedMismatch ? null : state.emailVerified,
    phoneVerified:
      channel === 'phone' && verifiedMismatch ? null : state.phoneVerified,
  });
}

export function clearContactVerificationForChannel(
  channel: ContactVerificationChannel,
): ContactVerificationResult {
  const state = readContactCodeVerificationState();

  saveState({
    ...state,
    emailPending: channel === 'email' ? null : state.emailPending,
    phonePending: channel === 'phone' ? null : state.phonePending,
    emailVerified: channel === 'email' ? null : state.emailVerified,
    phoneVerified: channel === 'phone' ? null : state.phoneVerified,
  });

  return {
    ok: true,
    message:
      channel === 'email'
        ? 'Email verification cleared. Request a new code to continue.'
        : 'Phone verification cleared. Request a new code to continue.',
  };
}

export function useContactCodeVerificationState(): ContactCodeVerificationState {
  return useSyncExternalStore(
    (listener) => {
      function onChange(): void {
        invalidate();
        listener();
      }

      window.addEventListener('nami-contact-code-verification-changed', onChange);
      window.addEventListener('storage', onChange);

      return () => {
        window.removeEventListener('nami-contact-code-verification-changed', onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    readContactCodeVerificationState,
    readContactCodeVerificationState,
  );
}
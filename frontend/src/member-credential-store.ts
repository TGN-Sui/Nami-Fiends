const CREDENTIALS_KEY = 'nami.member.password-credentials';

type StoredCredential = {
  salt: string;
  hash: string;
};

type CredentialRegistry = Record<string, StoredCredential>;

const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function readCredentialRegistry(): CredentialRegistry {
  try {
    const stored = window.localStorage.getItem(CREDENTIALS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as CredentialRegistry;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function writeCredentialRegistry(registry: CredentialRegistry): void {
  window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(registry));
}

function createSalt(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function hashPasswordSync(password: string, salt: string): string {
  let hash = 5381;
  const input = salt + '::' + password;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}

export function validatePasswordSetup(
  password: string,
  confirmPassword: string
): { ok: boolean; message: string | null } {
  const trimmed = password.trim();

  if (trimmed.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.',
    };
  }

  if (trimmed !== confirmPassword.trim()) {
    return { ok: false, message: 'Passwords do not match.' };
  }

  return { ok: true, message: null };
}

export function memberHasPasswordCredential(email: string): boolean {
  const registry = readCredentialRegistry();

  return Boolean(registry[normalizeEmail(email)]);
}

export function saveMemberPasswordCredential(email: string, password: string): void {
  const validation = validatePasswordSetup(password, password);

  if (!validation.ok) {
    return;
  }

  const salt = createSalt();
  const registry = readCredentialRegistry();

  registry[normalizeEmail(email)] = {
    salt,
    hash: hashPasswordSync(password.trim(), salt),
  };

  writeCredentialRegistry(registry);
}

export function verifyMemberPasswordCredential(email: string, password: string): boolean {
  const registry = readCredentialRegistry();
  const credential = registry[normalizeEmail(email)];

  if (!credential) {
    return false;
  }

  return credential.hash === hashPasswordSync(password.trim(), credential.salt);
}

export function resetMemberCredentialStoreForTests(): void {
  try {
    window.localStorage.removeItem(CREDENTIALS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}
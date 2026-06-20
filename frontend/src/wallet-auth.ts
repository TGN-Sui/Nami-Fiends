import { readWalletAuthRequired } from './protocol-env.js';

export type WalletAuthPayload = {
  signature: string;
  timestampMs: number;
};

export type WalletAuthOwnerSource = 'wallet' | 'zklogin' | 'demo' | null;

export type WalletAuthContext = {
  owner: string | null;
  source: WalletAuthOwnerSource;
  memberVerified: boolean;
};

const AUTH_CACHE_TTL_MS = 4 * 60 * 1000;

type WalletAuthSigner = (owner: string) => Promise<WalletAuthPayload>;

let walletAuthSigner: WalletAuthSigner | null = null;
let authContext: WalletAuthContext = {
  owner: null,
  source: null,
  memberVerified: false,
};

let cachedPayload: WalletAuthPayload | null = null;
let cachedOwner: string | null = null;
let cachedAtMs = 0;
let inFlightSign: Promise<WalletAuthPayload | null> | null = null;
let inFlightOwner: string | null = null;

export function buildWalletAuthMessage(owner: string, timestampMs: number): string {
  return 'nami-auth:v1:' + owner.toLowerCase() + ':' + String(timestampMs);
}

export function registerWalletAuthSigner(signer: WalletAuthSigner | null): void {
  walletAuthSigner = signer;
}

export function setWalletAuthContext(context: WalletAuthContext): void {
  const ownerChanged =
    authContext.owner?.toLowerCase() !== context.owner?.toLowerCase() ||
    authContext.source !== context.source;

  authContext = context;

  if (ownerChanged) {
    clearAuthCache();
  }
}

function clearAuthCache(): void {
  cachedPayload = null;
  cachedOwner = null;
  cachedAtMs = 0;
  inFlightSign = null;
  inFlightOwner = null;
}

export function canPromptWalletSignature(owner?: string): boolean {
  if (!readWalletAuthRequired()) {
    return false;
  }

  const resolvedOwner = owner ?? authContext.owner;

  if (!resolvedOwner?.startsWith('0x')) {
    return false;
  }

  if (authContext.source !== 'wallet' && authContext.source !== 'zklogin') {
    return false;
  }

  if (resolvedOwner.toLowerCase() !== authContext.owner?.toLowerCase()) {
    return false;
  }

  if (!authContext.memberVerified) {
    return false;
  }

  return walletAuthSigner !== null;
}

export async function createWalletAuthPayload(owner: string): Promise<WalletAuthPayload | null> {
  if (!readWalletAuthRequired() || !canPromptWalletSignature(owner) || !walletAuthSigner) {
    return null;
  }

  const now = Date.now();

  if (
    cachedPayload &&
    cachedOwner?.toLowerCase() === owner.toLowerCase() &&
    now - cachedAtMs < AUTH_CACHE_TTL_MS
  ) {
    return cachedPayload;
  }

  if (inFlightSign && inFlightOwner?.toLowerCase() === owner.toLowerCase()) {
    return inFlightSign;
  }

  const signPromise = walletAuthSigner(owner)
    .then((payload) => {
      cachedPayload = payload;
      cachedOwner = owner;
      cachedAtMs = Date.now();
      return payload;
    })
    .finally(() => {
      if (inFlightOwner?.toLowerCase() === owner.toLowerCase()) {
        inFlightSign = null;
        inFlightOwner = null;
      }
    });

  inFlightSign = signPromise;
  inFlightOwner = owner;

  return signPromise;
}

export function readWalletAuthOwner(): string | null {
  return authContext.owner;
}

export function resetWalletAuthStateForTests(): void {
  walletAuthSigner = null;
  authContext = {
    owner: null,
    source: null,
    memberVerified: false,
  };
  clearAuthCache();
}
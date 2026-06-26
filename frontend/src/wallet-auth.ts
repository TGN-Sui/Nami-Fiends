import { isOfficialOwner } from './nami-capabilities.js';
import { readWalletAuthRequired } from './protocol-env.js';

export type WalletAuthPayload = {
  signature: string;
  timestampMs: number;
  /** Ephemeral zkLogin signer address when the signature is not from the owner key. */
  signerAddress?: string;
};

export type WalletAuthOwnerSource = 'wallet' | 'zklogin' | 'linked' | 'demo' | null;

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
  if (signer !== walletAuthSigner) {
    clearAuthCache();
  }

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

  if (
    authContext.source !== 'wallet' &&
    authContext.source !== 'zklogin' &&
    authContext.source !== 'linked'
  ) {
    return false;
  }

  if (resolvedOwner.toLowerCase() !== authContext.owner?.toLowerCase()) {
    return false;
  }

  if (!authContext.memberVerified && !isOfficialOwner(resolvedOwner)) {
    return false;
  }

  return walletAuthSigner !== null;
}

/** Border equip sync can authorize any signed-in member with a live wallet signer. */
export function canPromptEquipSyncSignature(owner?: string): boolean {
  if (!readWalletAuthRequired()) {
    return true;
  }

  const resolvedOwner = owner ?? authContext.owner;

  if (!resolvedOwner?.startsWith('0x')) {
    return false;
  }

  if (resolvedOwner.toLowerCase() !== authContext.owner?.toLowerCase()) {
    return false;
  }

  if (
    authContext.source !== 'wallet' &&
    authContext.source !== 'zklogin' &&
    authContext.source !== 'linked'
  ) {
    return false;
  }

  if (!walletAuthSigner) {
    return false;
  }

  // Equip sync only needs a live signer for the active protocol owner.
  return true;
}

async function createSignedAuthPayload(
  owner: string,
  canSign: (owner?: string) => boolean
): Promise<WalletAuthPayload | null> {
  if (!readWalletAuthRequired() || !canSign(owner) || !walletAuthSigner) {
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

function shouldBypassWalletAuthCache(): boolean {
  // zkLogin signs with an ephemeral key; the backend must receive signerAddress every time.
  return authContext.source === 'zklogin';
}

export async function createWalletAuthPayload(owner: string): Promise<WalletAuthPayload | null> {
  if (!readWalletAuthRequired() || !canPromptWalletSignature(owner) || !walletAuthSigner) {
    return null;
  }

  if (shouldBypassWalletAuthCache()) {
    return walletAuthSigner(owner);
  }

  return createSignedAuthPayload(owner, canPromptWalletSignature);
}

export async function createCatalogSyncAuthPayload(owner: string): Promise<WalletAuthPayload | null> {
  if (!readWalletAuthRequired() || !canPromptWalletSignature(owner) || !walletAuthSigner) {
    return null;
  }

  // Border art catalog saves can include large data URLs — always mint a fresh zkLogin signature.
  return walletAuthSigner(owner);
}

export async function createEquipSyncAuthPayload(owner: string): Promise<WalletAuthPayload | null> {
  if (!readWalletAuthRequired() || !canPromptEquipSyncSignature(owner) || !walletAuthSigner) {
    return null;
  }

  // Always mint a fresh signature for equip sync so zkLogin signerAddress is never skipped.
  return walletAuthSigner(owner);
}

export function readWalletAuthOwner(): string | null {
  return authContext.owner;
}

export function readWalletAuthContext(): WalletAuthContext {
  return authContext;
}

export function hasWalletAuthSigner(): boolean {
  return walletAuthSigner !== null;
}

export function isEquipSyncAuthReady(owner?: string): boolean {
  if (!readWalletAuthRequired()) {
    return true;
  }

  return canPromptEquipSyncSignature(owner);
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
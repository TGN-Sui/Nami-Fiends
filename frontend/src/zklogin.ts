import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
} from '@mysten/sui/zklogin';

import { safeLocalStorageSetItem } from './local-storage-safe.js';
import { getConfiguredNetwork } from './nami.js';
import { readZkLoginEnvConfig } from './zklogin-config.js';

const PENDING_KEY = 'nami.zklogin.pending';
const SESSION_KEY = 'nami.zklogin.session';
const MAX_EPOCH_OFFSET = 2;

export interface ZkLoginSession {
  address: string;
  maxEpoch: number;
  provider: 'google';
  createdAtMs: number;
  ephemeralSecretKey?: string;
}

interface ZkLoginPending {
  ephemeralSecretKey: string;
  randomness: string;
  maxEpoch: number;
  network: string;
}

function readClientId(): string | null {
  return readZkLoginEnvConfig().clientId;
}

function readRedirectUrl(): string {
  return readZkLoginEnvConfig().redirectUrl;
}

function readSaltUrl(): string {
  return readZkLoginEnvConfig().saltUrl;
}

function createRpcClient(): SuiJsonRpcClient {
  const network = getConfiguredNetwork();

  if (network === 'localnet') {
    const url = import.meta.env.VITE_SUI_FULLNODE_URL ?? 'http://127.0.0.1:9000';

    return new SuiJsonRpcClient({ url, network: 'localnet' });
  }

  return new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl(network),
    network,
  });
}

export function isZkLoginConfigured(): boolean {
  return readClientId() !== null;
}

export function canZkLoginSignForOwner(owner: string | null | undefined): boolean {
  const session = getZkLoginSession();

  return Boolean(
    owner?.startsWith('0x') &&
      session?.ephemeralSecretKey &&
      session.address.toLowerCase() === owner.toLowerCase()
  );
}

export function getZkLoginSession(): ZkLoginSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);

  if (raw === null || raw.trim() === '') {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ZkLoginSession>;

    if (typeof parsed.address !== 'string' || !parsed.address.startsWith('0x')) {
      return null;
    }

    return {
      address: parsed.address,
      maxEpoch: typeof parsed.maxEpoch === 'number' ? parsed.maxEpoch : 0,
      provider: 'google',
      createdAtMs: typeof parsed.createdAtMs === 'number' ? parsed.createdAtMs : Date.now(),
      ...(typeof parsed.ephemeralSecretKey === 'string'
        ? { ephemeralSecretKey: parsed.ephemeralSecretKey }
        : {}),
    };
  } catch {
    return null;
  }
}

export function clearZkLoginSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(PENDING_KEY);
}

function saveSession(session: ZkLoginSession, fromOAuthReturn = false): void {
  if (!safeLocalStorageSetItem(SESSION_KEY, JSON.stringify(session))) {
    throw new Error(
      'Browser storage is full. Clear site data for nami-fiends.vercel.app or remove old chat caches, then sign in again.'
    );
  }

  window.localStorage.removeItem(PENDING_KEY);

  if (fromOAuthReturn) {
    window.sessionStorage.setItem('nami.zklogin.oauth-return', 'true');
    window.dispatchEvent(new CustomEvent('nami-zklogin-session-ready'));
  }
}

function parseHashParams(): URLSearchParams {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash);
}

async function fetchUserSalt(jwt: string): Promise<string> {
  const response = await fetch(readSaltUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: jwt }),
  });

  if (!response.ok) {
    throw new Error(`zkLogin salt request failed (${response.status}).`);
  }

  const body = (await response.json()) as { salt?: string };

  if (typeof body.salt !== 'string' || body.salt.trim() === '') {
    throw new Error('zkLogin salt response missing salt.');
  }

  return body.salt;
}

/**
 * Starts Google zkLogin OAuth. Stores ephemeral session state locally and redirects.
 */
export async function startZkLoginFlow(): Promise<void> {
  const clientId = readClientId();

  if (clientId === null) {
    throw new Error('Configure VITE_ZKLOGIN_CLIENT_ID to enable zkLogin.');
  }

  const client = createRpcClient();
  const systemState = await client.getLatestSuiSystemState();
  const maxEpoch = Number(systemState.epoch) + MAX_EPOCH_OFFSET;

  const ephemeralKeyPair = Ed25519Keypair.generate();
  const randomness = generateRandomness();
  const nonce = generateNonce(
    ephemeralKeyPair.getPublicKey(),
    maxEpoch,
    randomness
  );

  const pending: ZkLoginPending = {
    ephemeralSecretKey: ephemeralKeyPair.getSecretKey(),
    randomness,
    maxEpoch,
    network: getConfiguredNetwork(),
  };

  if (!safeLocalStorageSetItem(PENDING_KEY, JSON.stringify(pending))) {
    throw new Error(
      'Browser storage is full. Clear site data for this site, then try Google sign-in again.'
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: readRedirectUrl(),
    response_type: 'id_token',
    scope: 'openid',
    nonce,
  });

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

/**
 * Completes zkLogin when the OAuth redirect returns an id_token in the URL hash.
 * Returns the new session when established.
 */
export async function completeZkLoginFromRedirect(): Promise<ZkLoginSession | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const hashParams = parseHashParams();
  const idToken = hashParams.get('id_token');

  if (idToken === null || idToken.trim() === '') {
    return getZkLoginSession();
  }

  const pendingRaw = window.localStorage.getItem(PENDING_KEY);

  if (pendingRaw === null) {
    return getZkLoginSession();
  }

  try {
    const salt = await fetchUserSalt(idToken);
    const address = jwtToAddress(idToken, BigInt(salt), false);
    const pending = JSON.parse(pendingRaw) as ZkLoginPending;

    const session: ZkLoginSession = {
      address,
      maxEpoch: pending.maxEpoch,
      provider: 'google',
      createdAtMs: Date.now(),
      ephemeralSecretKey: pending.ephemeralSecretKey,
    };

    saveSession(session, true);

    const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);

    return session;
  } catch (error) {
    window.localStorage.removeItem(PENDING_KEY);

    const message =
      error instanceof Error ? error.message : 'zkLogin redirect could not be completed.';

    window.sessionStorage.setItem('nami.zklogin.last-error', message);
    return getZkLoginSession();
  }
}

export function consumeZkLoginOAuthReturn(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const flag = window.sessionStorage.getItem('nami.zklogin.oauth-return') === 'true';

  if (flag) {
    window.sessionStorage.removeItem('nami.zklogin.oauth-return');
  }

  return flag;
}

export function readZkLoginLastError(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const message = window.sessionStorage.getItem('nami.zklogin.last-error');

  if (!message) {
    return null;
  }

  window.sessionStorage.removeItem('nami.zklogin.last-error');
  return message;
}

export async function isZkLoginSessionExpired(
  session: ZkLoginSession | null = getZkLoginSession()
): Promise<boolean> {
  if (!session || !session.address || session.maxEpoch <= 0) {
    return true;
  }

  try {
    const client = createRpcClient();
    const systemState = await client.getLatestSuiSystemState();
    const currentEpoch = Number(systemState.epoch);

    return Number.isFinite(currentEpoch) && currentEpoch > session.maxEpoch;
  } catch {
    return false;
  }
}

export async function clearZkLoginSessionIfExpired(): Promise<boolean> {
  const session = getZkLoginSession();

  if (!session) {
    return false;
  }

  if (await isZkLoginSessionExpired(session)) {
    clearZkLoginSession();
    return true;
  }

  return false;
}

export function zkLoginStatusMessage(): string {
  if (!isZkLoginConfigured()) {
    return 'Set VITE_ZKLOGIN_CLIENT_ID (Google OAuth) to enable zkLogin sign-in.';
  }

  return 'Sign in with Google via zkLogin. Protocol reads use your derived Sui address.';
}

export { readZkLoginEnvConfig, validateZkLoginEnv, isZkLoginProductionReady } from './zklogin-config.js';

export function getExtendedEphemeralPublicKeyBase64(): string | null {
  const pendingRaw =
    typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_KEY) : null;

  if (pendingRaw === null) {
    return null;
  }

  try {
    const pending = JSON.parse(pendingRaw) as ZkLoginPending;
    const keypair = Ed25519Keypair.fromSecretKey(pending.ephemeralSecretKey);

    return getExtendedEphemeralPublicKey(keypair.getPublicKey());
  } catch {
    return null;
  }
}
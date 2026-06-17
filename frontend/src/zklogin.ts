import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
} from '@mysten/sui/zklogin';

import { getConfiguredNetwork } from './nami.js';

const PENDING_KEY = 'nami.zklogin.pending';
const SESSION_KEY = 'nami.zklogin.session';
const MAX_EPOCH_OFFSET = 2;

export interface ZkLoginSession {
  address: string;
  maxEpoch: number;
  provider: 'google';
  createdAtMs: number;
}

interface ZkLoginPending {
  ephemeralSecretKey: string;
  randomness: string;
  maxEpoch: number;
  network: string;
}

function readClientId(): string | null {
  const value = import.meta.env.VITE_ZKLOGIN_CLIENT_ID;

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  return value.trim();
}

function readRedirectUrl(): string {
  const value = import.meta.env.VITE_ZKLOGIN_REDIRECT_URL;

  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}`;
  }

  return 'http://localhost:5173/';
}

function readSaltUrl(): string {
  const value = import.meta.env.VITE_ZKLOGIN_SALT_URL;

  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim().replace(/\/$/, '');
  }

  return 'https://salt.api.mystenlabs.com/get_salt';
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

function saveSession(session: ZkLoginSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(PENDING_KEY);
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

  window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));

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
    };

    saveSession(session);

    const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);

    return session;
  } catch {
    return getZkLoginSession();
  }
}

export function zkLoginStatusMessage(): string {
  if (!isZkLoginConfigured()) {
    return 'Set VITE_ZKLOGIN_CLIENT_ID (Google OAuth) to enable zkLogin sign-in.';
  }

  return 'Sign in with Google via zkLogin. Protocol reads use your derived Sui address.';
}

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
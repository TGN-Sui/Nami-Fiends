import { shouldUseDemoOwnerFallback } from './app-config.js';
import { readLinkedWalletAddressForEmail } from './member-auth-link-store.js';
import { readMemberSession } from './member-session-store.js';
import { readDemoOwner } from './protocol-env.js';
import { readLastWalletOwner } from './protocol-owner-snapshot.js';
import { getZkLoginSession } from './zklogin.js';

export type ResolvedProtocolOwnerSource = 'wallet' | 'zklogin' | 'linked' | 'demo' | null;

export type ResolvedProtocolOwner = {
  owner: string | null;
  source: ResolvedProtocolOwnerSource;
};

/**
 * Single owner resolution for capability gates — mirrors useProtocolOwner() order:
 * connected wallet → zkLogin → linked wallet on member session → demo fallback.
 */
export function resolveProtocolOwnerState(): ResolvedProtocolOwner {
  const walletOwner = readLastWalletOwner();
  const zkOwner = getZkLoginSession()?.address ?? null;
  const session = readMemberSession();
  const linkedWallet = session ? readLinkedWalletAddressForEmail(session.email) : null;
  const demoOwner = shouldUseDemoOwnerFallback() ? readDemoOwner() : null;

  if (walletOwner) {
    return { owner: walletOwner, source: 'wallet' };
  }

  if (zkOwner) {
    return { owner: zkOwner, source: 'zklogin' };
  }

  if (linkedWallet) {
    return { owner: linkedWallet, source: 'linked' };
  }

  if (demoOwner) {
    return { owner: demoOwner, source: 'demo' };
  }

  return { owner: null, source: null };
}

export function readResolvedProtocolOwner(): string | null {
  return resolveProtocolOwnerState().owner;
}
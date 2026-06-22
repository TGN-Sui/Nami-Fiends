import { isTestLaunchMode, shouldUseDemoOwnerFallback } from './app-config.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { readLinkedWalletAddressForEmail } from './member-auth-link-store.js';
import { readMemberSession } from './member-session-store.js';
import { readDemoOwner, readOfficialOwner } from './protocol-env.js';
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
 *
 * When multiple identities are active, prefer whichever address matches
 * VITE_NAMI_OFFICIAL_OWNER so a browser wallet extension cannot mask zkLogin.
 */
export function resolveProtocolOwnerState(): ResolvedProtocolOwner {
  const walletOwner = readLastWalletOwner();
  const zkOwner = getZkLoginSession()?.address ?? null;
  const session = readMemberSession();
  const linkedWallet = session ? readLinkedWalletAddressForEmail(session.email) : null;
  const demoOwner = shouldUseDemoOwnerFallback() ? readDemoOwner() : null;
  const officialOwner = readOfficialOwner();
  const candidates: ResolvedProtocolOwner[] = [];

  if (walletOwner) {
    candidates.push({ owner: walletOwner, source: 'wallet' });
  }

  if (zkOwner) {
    candidates.push({ owner: zkOwner, source: 'zklogin' });
  }

  if (linkedWallet) {
    candidates.push({ owner: linkedWallet, source: 'linked' });
  }

  if (demoOwner) {
    candidates.push({ owner: demoOwner, source: 'demo' });
  }

  if (officialOwner) {
    const officialMatch = candidates.find(
      (candidate) => candidate.owner?.toLowerCase() === officialOwner.toLowerCase(),
    );

    if (officialMatch) {
      return officialMatch;
    }
  }

  if (isTestLaunchMode() && zkOwner && walletOwner && walletOwner.toLowerCase() !== zkOwner.toLowerCase()) {
    if (!isOfficialOwner(walletOwner)) {
      return { owner: zkOwner, source: 'zklogin' };
    }
  }

  return candidates[0] ?? { owner: null, source: null };
}

export function readResolvedProtocolOwner(): string | null {
  return resolveProtocolOwnerState().owner;
}
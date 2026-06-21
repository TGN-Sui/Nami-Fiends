import { shouldUseDemoOwnerFallback } from './app-config.js';
import { readLinkedWalletAddressForEmail } from './member-auth-link-store.js';
import { readMemberSession } from './member-session-store.js';
import { readDemoOwner } from './protocol-env.js';
import { readLastWalletOwner } from './protocol-owner-snapshot.js';
import { getZkLoginSession } from './zklogin.js';

/**
 * Single owner resolution for capability gates — mirrors useProtocolOwner() order:
 * connected wallet → zkLogin → linked wallet on member session → demo fallback.
 */
export function readResolvedProtocolOwner(): string | null {
  const walletOwner = readLastWalletOwner();
  const zkOwner = getZkLoginSession()?.address ?? null;
  const session = readMemberSession();
  const linkedWallet = session ? readLinkedWalletAddressForEmail(session.email) : null;
  const demoOwner = shouldUseDemoOwnerFallback() ? readDemoOwner() : null;

  return walletOwner ?? zkOwner ?? linkedWallet ?? demoOwner;
}
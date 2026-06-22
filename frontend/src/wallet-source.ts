import { isTestLaunchMode } from './app-config.js';
import type { ResolvedProtocolOwnerSource } from './protocol-owner-resolve.js';

export type TrustWalletSource = Exclude<ResolvedProtocolOwnerSource, null>;

/**
 * Resolves wallet source for trust / player score surfaces.
 * Demo wallet is never returned on official test-launch builds.
 */
export function resolveTrustWalletSource(
  source: ResolvedProtocolOwnerSource,
  walletLinked: boolean
): TrustWalletSource | null {
  if (!walletLinked) {
    return null;
  }

  if (source === 'demo' && isTestLaunchMode()) {
    return null;
  }

  if (source) {
    return source;
  }

  return isTestLaunchMode() ? null : 'demo';
}
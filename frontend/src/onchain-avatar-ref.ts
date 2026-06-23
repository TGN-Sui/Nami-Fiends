import { readSelfAvatarOverride } from './member-avatar-store.js';
import { getSelfMember } from './member-access.js';

const MAX_ONCHAIN_AVATAR_REF_LEN = 512;

/**
 * Compact avatar reference for the one-time enter_nami mint.
 * Full data URLs stay off-chain; on-chain stores a seed or short URL only.
 */
export function resolveOnchainAvatarRef(): string {
  const override = readSelfAvatarOverride()?.trim();

  if (override && override.length <= MAX_ONCHAIN_AVATAR_REF_LEN) {
    return override;
  }

  if (override) {
    return 'local:avatar';
  }

  return 'seed:' + getSelfMember().avatarSeed;
}
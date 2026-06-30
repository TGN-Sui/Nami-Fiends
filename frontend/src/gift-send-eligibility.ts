import { isMemberVerified } from './member-access.js';
import { isSelfMember } from './surface-preferences.js';
import type { NamiMember } from './uiMockData.js';
import { canZkLoginSignForOwner, getZkLoginSession } from './zklogin.js';

/** Prefer a signable zkLogin owner, then protocol owner, then a browser extension address. */
export function resolveGiftSenderOwner(
  protocolOwner: string | null | undefined,
  walletExtensionAddress: string | null | undefined
): string | null {
  const zkLoginAddress = getZkLoginSession()?.address ?? null;

  if (zkLoginAddress && canZkLoginSignForOwner(zkLoginAddress)) {
    return zkLoginAddress;
  }

  if (protocolOwner?.startsWith('0x')) {
    return protocolOwner;
  }

  if (walletExtensionAddress?.startsWith('0x')) {
    return walletExtensionAddress;
  }

  if (zkLoginAddress?.startsWith('0x')) {
    return zkLoginAddress;
  }

  return null;
}

export function giftSendBlockReason(input: {
  targetMemberId: string;
  senderOwner: string | null;
  selfMember: NamiMember;
}): string | null {
  if (isSelfMember(input.targetMemberId)) {
    return 'Pick another member — you cannot send gifts to your own profile.';
  }

  if (!input.senderOwner?.startsWith('0x')) {
    return 'Connect a Sui wallet extension or sign in with Google under Settings → Account.';
  }

  if (!isMemberVerified(input.selfMember)) {
    return 'Verify your passport in Settings before sending gifts.';
  }

  return null;
}
import { safeLocalStorageSetItem } from './local-storage-safe.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { readOfficialOwnerEmail } from './protocol-env.js';
import type { MemberSession } from './member-session-store.js';
import { readMemberSession, saveMemberSession } from './member-session-store.js';

const LINKS_KEY = 'nami.member.auth-links';

export type MemberAuthLinkMethod = 'email' | 'x' | 'zklogin' | 'wallet';

type MemberAuthLinkIndex = {
  byEmail: Record<string, string>;
  byXHandle: Record<string, string>;
  byZkLoginAddress: Record<string, string>;
  byWalletAddress: Record<string, string>;
};

function emptyIndex(): MemberAuthLinkIndex {
  return {
    byEmail: {},
    byXHandle: {},
    byZkLoginAddress: {},
    byWalletAddress: {},
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeXHandle(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase();
}

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

function readAuthLinkIndex(): MemberAuthLinkIndex {
  try {
    const stored = window.localStorage.getItem(LINKS_KEY);

    if (!stored) {
      return emptyIndex();
    }

    const parsed = JSON.parse(stored) as Partial<MemberAuthLinkIndex>;

    return {
      byEmail:
        parsed.byEmail !== null && typeof parsed.byEmail === 'object' && !Array.isArray(parsed.byEmail)
          ? parsed.byEmail
          : {},
      byXHandle:
        parsed.byXHandle !== null &&
        typeof parsed.byXHandle === 'object' &&
        !Array.isArray(parsed.byXHandle)
          ? parsed.byXHandle
          : {},
      byZkLoginAddress:
        parsed.byZkLoginAddress !== null &&
        typeof parsed.byZkLoginAddress === 'object' &&
        !Array.isArray(parsed.byZkLoginAddress)
          ? parsed.byZkLoginAddress
          : {},
      byWalletAddress:
        parsed.byWalletAddress !== null &&
        typeof parsed.byWalletAddress === 'object' &&
        !Array.isArray(parsed.byWalletAddress)
          ? parsed.byWalletAddress
          : {},
    };
  } catch {
    return emptyIndex();
  }
}

function writeAuthLinkIndex(index: MemberAuthLinkIndex): void {
  safeLocalStorageSetItem(LINKS_KEY, JSON.stringify(index));
  window.dispatchEvent(new CustomEvent('nami-member-auth-links-changed'));
}

function resolveSessionByRegistryEmail(registryEmail: string): MemberSession | null {
  try {
    const stored = window.localStorage.getItem('nami.member.accounts');

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Record<string, MemberSession>;
    const session = parsed[registryEmail];

    if (!session || typeof session.email !== 'string') {
      return null;
    }

    saveMemberSession(session);

    return session;
  } catch {
    return null;
  }
}

function restoreByRegistryKey(registryEmail: string | undefined): MemberSession | null {
  if (!registryEmail) {
    return null;
  }

  const active = readMemberSession();

  if (active && normalizeEmail(active.email) === normalizeEmail(registryEmail)) {
    return active;
  }

  return resolveSessionByRegistryEmail(registryEmail);
}

export function linkMemberSessionAuth(
  session: MemberSession,
  links: {
    email?: string | null;
    xHandle?: string | null;
    zkLoginAddress?: string | null;
    walletAddress?: string | null;
  },
): void {
  const index = readAuthLinkIndex();
  const registryEmail = normalizeEmail(session.email);

  index.byEmail[registryEmail] = registryEmail;

  if (links.email) {
    index.byEmail[normalizeEmail(links.email)] = registryEmail;
  }

  if (links.xHandle) {
    index.byXHandle[normalizeXHandle(links.xHandle)] = registryEmail;
  }

  if (links.zkLoginAddress) {
    index.byZkLoginAddress[normalizeAddress(links.zkLoginAddress)] = registryEmail;
  }

  if (links.walletAddress) {
    index.byWalletAddress[normalizeAddress(links.walletAddress)] = registryEmail;
  }

  writeAuthLinkIndex(index);
}

export function restoreMemberSessionByEmail(email: string): MemberSession | null {
  const normalized = normalizeEmail(email);
  const index = readAuthLinkIndex();

  return restoreByRegistryKey(index.byEmail[normalized] ?? normalized);
}

export function restoreMemberSessionByXHandle(handle: string): MemberSession | null {
  const index = readAuthLinkIndex();

  return restoreByRegistryKey(index.byXHandle[normalizeXHandle(handle)]);
}

export function restoreMemberSessionByZkLoginAddress(address: string): MemberSession | null {
  const index = readAuthLinkIndex();

  return restoreByRegistryKey(index.byZkLoginAddress[normalizeAddress(address)]);
}

export function restoreMemberSessionByWalletAddress(address: string): MemberSession | null {
  const index = readAuthLinkIndex();

  return restoreByRegistryKey(index.byWalletAddress[normalizeAddress(address)]);
}

export function readLinkedWalletAddressForEmail(email: string): string | null {
  const registryEmail = normalizeEmail(email);
  const index = readAuthLinkIndex();

  for (const [walletAddress, mappedEmail] of Object.entries(index.byWalletAddress)) {
    if (normalizeEmail(mappedEmail) === registryEmail && walletAddress.startsWith('0x')) {
      return walletAddress;
    }
  }

  return null;
}

export function restoreMemberSessionByLinkedOwner(
  owner: string,
  source: 'wallet' | 'zklogin',
): MemberSession | null {
  if (source === 'zklogin') {
    return restoreMemberSessionAfterZkLogin(owner);
  }

  return restoreMemberSessionByWalletAddress(owner);
}

/** Restore passport session after Google zkLogin, including official-owner email fallback. */
export function restoreMemberSessionAfterZkLogin(address: string): MemberSession | null {
  let restored = restoreMemberSessionByZkLoginAddress(address);

  if (!restored && isOfficialOwner(address)) {
    const officialEmail = readOfficialOwnerEmail();

    if (officialEmail) {
      restored = restoreMemberSessionByEmail(officialEmail);
    }
  }

  if (restored) {
    linkMemberSessionAuth(restored, {
      email: restored.email,
      zkLoginAddress: address,
    });
  }

  return restored;
}
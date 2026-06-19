import { getSelfMember, isMemberVerified, SELF_MEMBER_ID } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

export type EmbeddedFeedSurface = 'member' | 'studio' | 'game' | 'guild';
export type UserSurfaceRole = 'member' | 'channel-owner' | 'guild-owner';

const EMBEDDED_PREFIX = 'nami.embedded-feed.';
const OWNER_CHANNEL_KEY = 'nami.viewing-as-channel-owner';
const USER_SURFACE_ROLE_KEY = 'nami.user.surface-role';

export function readUserSurfaceRole(): UserSurfaceRole {
  try {
    const stored = window.localStorage.getItem(USER_SURFACE_ROLE_KEY);

    if (stored === 'channel-owner' || stored === 'guild-owner' || stored === 'member') {
      return stored;
    }

    if (window.localStorage.getItem(OWNER_CHANNEL_KEY) === 'true') {
      return 'channel-owner';
    }
  } catch {
    // fall through
  }

  return 'member';
}

export function saveUserSurfaceRole(role: UserSurfaceRole): void {
  window.localStorage.setItem(USER_SURFACE_ROLE_KEY, role);
  window.localStorage.setItem(OWNER_CHANNEL_KEY, role === 'channel-owner' ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('nami-surface-role-changed'));
}

const LEGACY_MEMBER_FEED_ENABLED_KEY = EMBEDDED_PREFIX + 'member';

function embeddedFeedEnabledKey(surface: EmbeddedFeedSurface, memberId?: string): string {
  if (surface === 'member') {
    return EMBEDDED_PREFIX + 'member.' + (memberId ?? SELF_MEMBER_ID);
  }

  return EMBEDDED_PREFIX + surface;
}

function migrateLegacyMemberFeedEnabled(memberId: string): boolean | null {
  if (memberId !== SELF_MEMBER_ID) {
    return null;
  }

  const legacy = window.localStorage.getItem(LEGACY_MEMBER_FEED_ENABLED_KEY);

  if (legacy === null) {
    return null;
  }

  const enabled = legacy === 'true';
  window.localStorage.setItem(embeddedFeedEnabledKey('member', memberId), legacy);
  window.localStorage.removeItem(LEGACY_MEMBER_FEED_ENABLED_KEY);

  return enabled;
}

export function readEmbeddedFeedEnabled(surface: EmbeddedFeedSurface, memberId?: string): boolean {
  try {
    const key = embeddedFeedEnabledKey(surface, memberId);
    const stored = window.localStorage.getItem(key);

    if (stored !== null) {
      return stored === 'true';
    }

    if (surface === 'member') {
      const migrated = migrateLegacyMemberFeedEnabled(memberId ?? SELF_MEMBER_ID);

      if (migrated !== null) {
        return migrated;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function saveEmbeddedFeedEnabled(
  surface: EmbeddedFeedSurface,
  enabled: boolean,
  memberId?: string
): void {
  const resolvedMemberId = surface === 'member' ? memberId ?? SELF_MEMBER_ID : undefined;

  window.localStorage.setItem(
    embeddedFeedEnabledKey(surface, resolvedMemberId),
    enabled ? 'true' : 'false'
  );
  window.dispatchEvent(
    new CustomEvent('nami-embedded-feed-enabled-changed', {
      detail: { surface, memberId: resolvedMemberId },
    })
  );
}

export function subscribeEmbeddedFeedEnabled(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-embedded-feed-enabled-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-embedded-feed-enabled-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function getConfigurableEmbeddedFeedSurfaces(
  role: UserSurfaceRole = readUserSurfaceRole(),
  member: NamiMember = getSelfMember()
): EmbeddedFeedSurface[] {
  if (role === 'channel-owner') {
    return ['game'];
  }

  if (role === 'guild-owner') {
    return ['guild'];
  }

  if ((member.tier === 'Pro' || member.tier === 'Elite') && isMemberVerified(member)) {
    return ['member'];
  }

  return [];
}

export function canConfigureEmbeddedFeedSurface(
  surface: EmbeddedFeedSurface,
  role: UserSurfaceRole = readUserSurfaceRole(),
  member: NamiMember = getSelfMember()
): boolean {
  return getConfigurableEmbeddedFeedSurfaces(role, member).includes(surface);
}

export function canShowEmbeddedFeedSurface(
  surface: EmbeddedFeedSurface,
  role: UserSurfaceRole = readUserSurfaceRole(),
  member: NamiMember = getSelfMember()
): boolean {
  return readEmbeddedFeedEnabled(surface) || canConfigureEmbeddedFeedSurface(surface, role, member);
}

export function readViewingAsChannelOwner(): boolean {
  return readUserSurfaceRole() === 'channel-owner';
}

export function saveViewingAsChannelOwner(enabled: boolean): void {
  saveUserSurfaceRole(enabled ? 'channel-owner' : 'member');
}

export function readViewingAsGuildOwner(): boolean {
  return readUserSurfaceRole() === 'guild-owner';
}

export function saveViewingAsGuildOwner(enabled: boolean): void {
  saveUserSurfaceRole(enabled ? 'guild-owner' : 'member');
}

export function subscribeSurfaceRole(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-surface-role-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-surface-role-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function isSelfMember(memberId: string): boolean {
  return memberId === SELF_MEMBER_ID;
}
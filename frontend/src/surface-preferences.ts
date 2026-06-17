import { getSelfMember, isMemberVerified } from './member-access.js';
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

export function readEmbeddedFeedEnabled(surface: EmbeddedFeedSurface): boolean {
  try {
    return window.localStorage.getItem(EMBEDDED_PREFIX + surface) === 'true';
  } catch {
    return false;
  }
}

export function saveEmbeddedFeedEnabled(surface: EmbeddedFeedSurface, enabled: boolean): void {
  window.localStorage.setItem(EMBEDDED_PREFIX + surface, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('nami-embedded-feed-enabled-changed', { detail: { surface } }));
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
  return memberId === 'm1';
}
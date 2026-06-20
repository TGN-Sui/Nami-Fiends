import { ownsGameChannel } from './channel-owner-access.js';
import {
  isFullyApprovedGameOwner,
  isPreApprovedGameOwner,
  readGameOwnerSession,
} from './game-owner-session-store.js';

export type PreApprovedOwnerCapability =
  | 'create-hidden-events'
  | 'upload-banner-covers'
  | 'purchase-promotions'
  | 'submit-partner-ticket'
  | 'send-banners'
  | 'upload-channel-emojis';

export function isPreApprovedGameOwnerWorkspace(channelId?: string): boolean {
  if (!isPreApprovedGameOwner() || isFullyApprovedGameOwner()) {
    return false;
  }

  if (!channelId) {
    return true;
  }

  const session = readGameOwnerSession();

  if (session && session.provisionalChannelId === channelId) {
    return true;
  }

  return ownsGameChannel(channelId);
}

export function preApprovedOwnerRestrictionMessage(feature: string): string {
  return feature + ' unlocks after Nami Officials fully approve your game channel.';
}

export function preApprovedOwnerCapabilityAllowed(
  capability: PreApprovedOwnerCapability,
  channelId?: string,
): boolean {
  if (!isPreApprovedGameOwnerWorkspace(channelId)) {
    return true;
  }

  if (capability === 'create-hidden-events' || capability === 'upload-banner-covers') {
    return true;
  }

  return false;
}

export function canViewHiddenChannelEventDrafts(channelId: string): boolean {
  return isPreApprovedGameOwnerWorkspace(channelId) && ownsGameChannel(channelId);
}
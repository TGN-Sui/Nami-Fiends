import { channels as seedChannels } from './fixtures/seed-data.js';
import { readGameOwnerSession } from './game-owner-session-store.js';
import { withChannelOwnerProfile } from './channel-owner-profile-store.js';
import { readSignedInOwner } from './member-access.js';
import { isOfficialOwner } from './nami-capabilities.js';
import {
  listOwnerProvisionedChannelsSorted,
  ownerProvisionedChannelById,
  readActiveOwnerProvisionedChannelId,
  saveActiveOwnerProvisionedChannelId,
} from './owner-provisioned-channels-store.js';
import { buildOwnerProvisionedGameChannel } from './owner-provisioned-game-channel.js';
import { buildProvisionalGameChannel } from './provisional-game-channel.js';
import { formatGameGenresForDisplay } from './game-genres.js';
import {
  gameSubmissionTicketByChannelId,
  resolveGameTicketChannelId,
  type GameSubmissionTicket,
} from './game-submission-ticket-store.js';
import type { GameOwnerSession } from './game-owner-session-store.js';
import { readViewingAsChannelOwner } from './surface-preferences.js';
import { channels, type NamiChannel } from './uiMockData.js';

const OWNED_CHANNEL_KEY = 'nami.owned-game-channel-id';
const DEFAULT_OWNED_CHANNEL_ID = 'vortex';

export { saveActiveOwnerProvisionedChannelId } from './owner-provisioned-channels-store.js';

export function isGameChannelOwner(): boolean {
  return readViewingAsChannelOwner();
}

function readPersistedOwnedGameChannelId(): string | null {
  try {
    const stored = window.localStorage.getItem(OWNED_CHANNEL_KEY);

    return stored && stored.trim().length > 0 ? stored : null;
  } catch {
    return null;
  }
}

function hasApprovedGameOwnerSession(): boolean {
  const session = readGameOwnerSession();

  return Boolean(
    session &&
      (session.approvalStatus === 'approved' || session.approvalStatus === 'preapproved'),
  );
}

/** True when the signed-in user owns a game channel, even outside channel-owner surface mode. */
export function qualifiesForOwnerSoloGuild(): boolean {
  if (readViewingAsChannelOwner()) {
    return true;
  }

  if (hasApprovedGameOwnerSession()) {
    return true;
  }

  const owner = readSignedInOwner();

  if (owner && isOfficialOwner(owner)) {
    const hasEditableProvisionedChannel = listOwnerProvisionedChannelsSorted().some(
      (entry) =>
        entry.status !== 'claimed' && entry.createdByOwner.toLowerCase() === owner.toLowerCase(),
    );

    if (hasEditableProvisionedChannel) {
      return true;
    }
  }

  const persistedChannelId = readPersistedOwnedGameChannelId();

  if (persistedChannelId) {
    const ticket = gameSubmissionTicketByChannelId(persistedChannelId);

    if (ticket?.status === 'approved') {
      return true;
    }

    if (ownerProvisionedChannelById(persistedChannelId)) {
      return true;
    }
  }

  return false;
}

export function saveOwnedGameChannelId(channelId: string): void {
  window.localStorage.setItem(OWNED_CHANNEL_KEY, channelId);
}

export function readOwnedGameChannelId(): string | null {
  if (!isGameChannelOwner()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(OWNED_CHANNEL_KEY);

    if (stored) {
      return stored;
    }
  } catch {
    // fall through
  }

  return DEFAULT_OWNED_CHANNEL_ID;
}

function findChannelById(channelId: string): NamiChannel | undefined {
  return (
    channels.find((channel) => channel.id === channelId) ??
    seedChannels.find((channel) => channel.id === channelId)
  );
}

export function canOfficialOwnerEditProvisionedChannel(channelId: string): boolean {
  const owner = readSignedInOwner();

  if (!isOfficialOwner(owner)) {
    return false;
  }

  const entry = ownerProvisionedChannelById(channelId);

  if (!entry || entry.status === 'claimed') {
    return false;
  }

  return entry.createdByOwner.toLowerCase() === owner!.toLowerCase();
}

function resolveOfficialOwnerEditableProvisionedChannel(): NamiChannel | undefined {
  const owner = readSignedInOwner();

  if (!isOfficialOwner(owner)) {
    return undefined;
  }

  const activeId = readActiveOwnerProvisionedChannelId();

  if (activeId) {
    const activeEntry = ownerProvisionedChannelById(activeId);

    if (
      activeEntry &&
      activeEntry.status !== 'claimed' &&
      activeEntry.createdByOwner.toLowerCase() === owner!.toLowerCase()
    ) {
      return buildOwnerProvisionedGameChannel(activeEntry);
    }
  }

  const editableEntry = listOwnerProvisionedChannelsSorted().find(
    (entry) =>
      entry.status !== 'claimed' && entry.createdByOwner.toLowerCase() === owner!.toLowerCase()
  );

  if (!editableEntry) {
    return undefined;
  }

  return buildOwnerProvisionedGameChannel(editableEntry);
}

function gameOwnerSessionFromTicket(ticket: GameSubmissionTicket): GameOwnerSession {
  return {
    ticketId: ticket.id,
    provisionalChannelId: resolveGameTicketChannelId(ticket),
    gameTitle: ticket.gameTitle,
    studioName: ticket.studioName,
    contactName: ticket.contactName,
    email: ticket.email,
    phone: ticket.phone,
    tagline: ticket.gameTitle + ' on Nami',
    genre: formatGameGenresForDisplay(ticket.genres) || 'Indie',
    platforms: [...ticket.platforms],
    officialSocialPlatform: ticket.officialSocialPlatform,
    officialSocialHandle: ticket.officialSocialHandle,
    officialSocialVerified: ticket.officialSocialVerified,
    walletAddress: ticket.walletAddress,
    trustScore: ticket.trustScore,
    trustScoreTier: ticket.trustScoreTier,
    approvalStatus: ticket.status,
    questionnaireStarted: ticket.questionnaireStarted,
    questionnaireComplete: false,
    submittedAtMs: ticket.submittedAtMs,
  };
}

export function resolveChannelById(channelId: string): NamiChannel | undefined {
  const seeded = findChannelById(channelId);

  if (seeded) {
    return seeded;
  }

  const ownerProvisioned = ownerProvisionedChannelById(channelId);

  if (ownerProvisioned) {
    const ticket = gameSubmissionTicketByChannelId(channelId);

    return buildOwnerProvisionedGameChannel(
      ownerProvisioned,
      ticket?.status === 'approved' ? gameOwnerSessionFromTicket(ticket) : null
    );
  }

  const ticket = gameSubmissionTicketByChannelId(channelId);

  if (ticket) {
    return buildProvisionalGameChannel(gameOwnerSessionFromTicket(ticket));
  }

  return undefined;
}

export function resolveOwnedGameChannel(): NamiChannel | undefined {
  const gameOwnerSession = readGameOwnerSession();

  if (gameOwnerSession) {
    const channelId = gameOwnerSession.provisionalChannelId;
    const ownerProvisioned = ownerProvisionedChannelById(channelId);

    if (ownerProvisioned) {
      const provisioned = buildOwnerProvisionedGameChannel(ownerProvisioned, gameOwnerSession);
      saveOwnedGameChannelId(provisioned.id);
      return provisioned;
    }

    const seeded = findChannelById(channelId);

    if (seeded) {
      saveOwnedGameChannelId(seeded.id);
      return withChannelOwnerProfile(seeded);
    }

    const provisional = buildProvisionalGameChannel(gameOwnerSession);
    saveOwnedGameChannelId(provisional.id);
    return provisional;
  }

  const officialOwnerChannel = resolveOfficialOwnerEditableProvisionedChannel();

  if (officialOwnerChannel) {
    saveOwnedGameChannelId(officialOwnerChannel.id);
    saveActiveOwnerProvisionedChannelId(officialOwnerChannel.id);
    return officialOwnerChannel;
  }

  const channelId = readOwnedGameChannelId();

  if (!channelId) {
    return undefined;
  }

  const resolved = resolveChannelById(channelId);

  if (resolved) {
    return withChannelOwnerProfile(resolved);
  }

  const fallback = findChannelById(DEFAULT_OWNED_CHANNEL_ID);

  return fallback ? withChannelOwnerProfile(fallback) : undefined;
}

export function ownsGameChannel(channelId: string): boolean {
  if (canOfficialOwnerEditProvisionedChannel(channelId)) {
    return true;
  }

  if (!isGameChannelOwner()) {
    return false;
  }

  const ownedChannel = resolveOwnedGameChannel();

  return ownedChannel?.id === channelId;
}

export function isViewingOwnGameChannel(channelId: string): boolean {
  return ownsGameChannel(channelId);
}
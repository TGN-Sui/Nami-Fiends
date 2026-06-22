import type { NamiChannel } from './domain/types.js';
import type { GameOwnerSession } from './game-owner-session-store.js';
import {
  listOwnerProvisionedChannelsSorted,
  ownerProvisionedChannelById,
} from './owner-provisioned-channels-store.js';
import { buildOwnerProvisionedGameChannel } from './owner-provisioned-game-channel.js';
import { buildProvisionalGameChannel } from './provisional-game-channel.js';
import {
  listGameSubmissionTicketsSorted,
  resolveGameTicketChannelId,
  type GameSubmissionTicket,
} from './game-submission-ticket-store.js';
import { formatGameGenresForDisplay } from './game-genres.js';

function normalizeChannelHandle(handle: string): string {
  return handle.replace(/^@+/, '').toLowerCase();
}

export function channelDirectoryDedupeKey(channel: NamiChannel): string {
  const handle = normalizeChannelHandle(channel.handle);

  if (handle.length > 0) {
    return 'handle:' + handle;
  }

  return 'id:' + channel.id;
}

export function dedupeChannelsByIdentity(channels: NamiChannel[]): NamiChannel[] {
  const seen = new Set<string>();

  return channels.filter((channel) => {
    const key = channelDirectoryDedupeKey(channel);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sessionFromApprovedTicket(ticket: GameSubmissionTicket): GameOwnerSession {
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
    approvalStatus: 'approved',
    questionnaireStarted: ticket.questionnaireStarted,
    questionnaireComplete: false,
    submittedAtMs: ticket.submittedAtMs,
  };
}

function buildPublicChannelFromApprovedTicket(ticket: GameSubmissionTicket): NamiChannel {
  const channelId = resolveGameTicketChannelId(ticket);
  const session = sessionFromApprovedTicket(ticket);
  const ownerProvisioned = ownerProvisionedChannelById(channelId);

  if (ownerProvisioned) {
    return buildOwnerProvisionedGameChannel(ownerProvisioned, session);
  }

  return buildProvisionalGameChannel({
    ...session,
    provisionalChannelId: channelId,
  });
}

export function listLocalDiscoveryChannels(): NamiChannel[] {
  const channels: NamiChannel[] = [];

  for (const entry of listOwnerProvisionedChannelsSorted()) {
    channels.push(buildOwnerProvisionedGameChannel(entry));
  }

  for (const ticket of listGameSubmissionTicketsSorted()) {
    if (ticket.status !== 'approved') {
      continue;
    }

    channels.push(buildPublicChannelFromApprovedTicket(ticket));
  }

  return dedupeChannelsByIdentity(channels);
}
import type { GameSubmissionTicket } from './game-submission-ticket-store.js';
import type { MemberSession } from './member-session-store.js';
import { mergeRegisteredMemberAccountsFromServer } from './member-session-store.js';
import {
  replaceOwnerProvisionedChannelsFromServer,
  type OwnerProvisionedChannel,
} from './owner-provisioned-channels-store.js';
import type { PendingNodenameClaim } from './nami-admin-store.js';
import type { NamiUserSuggestion } from './nami-user-suggestions-store.js';
import {
  fetchOfficialsSubmissions,
  isOfficialsSubmissionsApiAvailable,
  syncOfficialsSubmissions,
  type SyncOfficialsSubmissionsInput,
} from './officials-submissions-api.js';
import type { PartnerBannerSubmission } from './partner-banner-submission-store.js';

const SUGGESTIONS_KEY = 'nami.user.suggestions';
const TICKETS_KEY = 'nami.game.submission.tickets';
const PARTNER_BANNERS_KEY = 'nami.partner.banner.submissions';
const NODENAME_CLAIMS_KEY = 'nami.admin.pendingClaims';
function writeJson(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function dispatchHydrated(): void {
  window.dispatchEvent(new CustomEvent('nami-user-suggestions-changed'));
  window.dispatchEvent(new CustomEvent('nami-game-submission-tickets-changed'));
  window.dispatchEvent(new CustomEvent('nami-partner-banner-submissions-changed'));
  window.dispatchEvent(new CustomEvent('nami-admin-changed'));
  window.dispatchEvent(new CustomEvent('nami-owner-provisioned-channels-changed'));
  window.dispatchEvent(new CustomEvent('nami-member-session-changed'));
}

let hydrationPromise: Promise<boolean> | null = null;

export function bootstrapOfficialsSubmissionsHydration(): Promise<boolean> {
  if (!hydrationPromise) {
    hydrationPromise = hydrateOfficialsSubmissionsFromServer();
  }

  return hydrationPromise;
}

export async function hydrateOfficialsSubmissionsFromServer(): Promise<boolean> {
  if (!isOfficialsSubmissionsApiAvailable()) {
    return false;
  }

  try {
    const projection = await fetchOfficialsSubmissions();

    writeJson(SUGGESTIONS_KEY, projection.suggestions);
    writeJson(TICKETS_KEY, projection.gameTickets);
    writeJson(PARTNER_BANNERS_KEY, projection.partnerBanners);
    writeJson(NODENAME_CLAIMS_KEY, projection.nodenameClaims);

    if (Array.isArray(projection.ownerProvisionedChannels)) {
      replaceOwnerProvisionedChannelsFromServer(
        projection.ownerProvisionedChannels as OwnerProvisionedChannel[]
      );
    }

    if (Array.isArray(projection.registeredMemberAccounts)) {
      mergeRegisteredMemberAccountsFromServer(
        projection.registeredMemberAccounts as MemberSession[]
      );
    }

    dispatchHydrated();
    void import('./passport-claim-status-sync.js').then(({ syncUserClaimStatusFromHydratedClaims }) => {
      syncUserClaimStatusFromHydratedClaims();
    });
    return true;
  } catch {
    return false;
  }
}

export function queueOfficialsSubmissionsSync(input: SyncOfficialsSubmissionsInput): void {
  if (!isOfficialsSubmissionsApiAvailable()) {
    return;
  }

  void syncOfficialsSubmissions(input).catch(() => {
    // Best-effort — unsigned sessions skip server sync until wallet/zkLogin connects.
  });
}

export function syncSuggestionsToServer(suggestions: NamiUserSuggestion[]): void {
  queueOfficialsSubmissionsSync({ suggestions });
}

export function syncGameTicketsToServer(gameTickets: GameSubmissionTicket[]): void {
  queueOfficialsSubmissionsSync({ gameTickets });
}

export function syncPartnerBannersToServer(partnerBanners: PartnerBannerSubmission[]): void {
  queueOfficialsSubmissionsSync({ partnerBanners });
}

export function syncNodenameClaimsToServer(nodenameClaims: PendingNodenameClaim[]): void {
  queueOfficialsSubmissionsSync({ nodenameClaims });
}

export function syncOwnerProvisionedChannelsToServer(
  ownerProvisionedChannels: OwnerProvisionedChannel[]
): void {
  queueOfficialsSubmissionsSync({ ownerProvisionedChannels });
}
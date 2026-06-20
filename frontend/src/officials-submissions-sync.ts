import type { GameSubmissionTicket } from './game-submission-ticket-store.js';
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
    dispatchHydrated();
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
    // Best-effort until officials auth hardening lands.
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
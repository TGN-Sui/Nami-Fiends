import type { PlayerLinkPlatform } from './player-link-store.js';

/** Stable platform user id from OAuth/API — not a display handle. */
export type VerifiedPlatformLinkRecord = {
  platformId: PlayerLinkPlatform;
  linkedAtMs: number;
  /** Backend confirmed OAuth + sybil-clear bind. */
  verified: boolean;
  platformUserId?: string;
  /** From platform API when available. */
  accountCreatedAtMs?: number | null;
  /** Server-computed eligibility; wins when present. */
  scoreEligible?: boolean;
  /** Post-passport achievements or playtime from platform API. */
  hasPostPassportActivity?: boolean;
};

export type PlatformScoreEligibilityContext = {
  passportCreatedAtMs: number | null;
};

export type PlatformScoreEligibilityResult = {
  eligible: boolean;
  reason: string;
};

const FRESH_ACCOUNT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function evaluatePlatformScoreEligibility(
  link: VerifiedPlatformLinkRecord,
  context: PlatformScoreEligibilityContext
): PlatformScoreEligibilityResult {
  if (link.scoreEligible === true) {
    return { eligible: true, reason: 'Server marked platform link score-eligible.' };
  }

  if (link.scoreEligible === false) {
    return { eligible: false, reason: 'Server marked platform link ineligible for score.' };
  }

  if (!link.verified) {
    return {
      eligible: false,
      reason: 'Platform link is pending OAuth verification — no Player Score until API confirms.',
    };
  }

  if (
    typeof link.accountCreatedAtMs === 'number' &&
    link.linkedAtMs - link.accountCreatedAtMs < FRESH_ACCOUNT_WINDOW_MS
  ) {
    return {
      eligible: false,
      reason: 'New platform account created too recently — cannot raise Player Score.',
    };
  }

  if (
    context.passportCreatedAtMs !== null &&
    link.linkedAtMs > context.passportCreatedAtMs &&
    link.hasPostPassportActivity !== true
  ) {
    return {
      eligible: false,
      reason:
        'Platform linked after passport signup — score requires post-passport play history from the API.',
    };
  }

  return { eligible: true, reason: 'Verified platform link with sufficient history.' };
}

export function filterScoreEligiblePlatformIds(
  links: readonly VerifiedPlatformLinkRecord[],
  context: PlatformScoreEligibilityContext
): PlayerLinkPlatform[] {
  const eligible: PlayerLinkPlatform[] = [];

  for (const link of links) {
    if (evaluatePlatformScoreEligibility(link, context).eligible) {
      eligible.push(link.platformId);
    }
  }

  return eligible;
}
import { useSyncExternalStore } from 'react';

import { isMockMembershipCheckoutEnabled } from './app-config.js';
import { readOwnedGameChannelId } from './channel-owner-access.js';
import {
  CHANNEL_MEDIA_REF_PREFIX,
  externalizePromotionCoverUrl,
  PARTNER_CAROUSEL_COVER_PREFIX,
  readPartnerCarouselCoverUrl,
  readSuperBannerCoverUrl,
  resolveChannelMediaRef,
  SUPER_BANNER_COVER_PREFIX,
} from './channel-owner-media-store.js';
import {
  preApprovedOwnerCapabilityAllowed,
  preApprovedOwnerRestrictionMessage,
} from './game-owner-approval-guards.js';
import type {
  MembershipBillingCycle,
  MembershipCheckoutRail,
  MembershipCryptoAsset,
} from './membership-plans-store.js';

export type PromotionDuration = '24h' | '72h' | 'weekly';

export type PromotionProduct = 'super-banner' | 'hub-featured' | 'partner-carousel';

export type PromotionPurchaseStatus = 'inactive' | 'pending-payment' | 'active';

export type SuperBannerDraft = {
  coverUrl: string;
  headline: string;
  body: string;
};

export type PartnerCarouselTicket = {
  id: string;
  channelId: string;
  coverUrl: string;
  title: string;
  description: string;
  duration: PromotionDuration;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAtMs: number | null;
  expiresAtMs: number | null;
  updatedAtMs: number;
};

export type OwnerPromotionStatus = {
  id: PromotionProduct | 'partner-carousel-live';
  label: string;
  detail: string;
  expiresAtMs: number | null;
  remainingLabel: string | null;
  isActive: boolean;
};

/** Per-channel promotion bundle — each game channel owns its own drafts and purchases. */
export type ChannelOwnerPromotionsState = {
  superBanner: {
    status: PromotionPurchaseStatus;
    draft: SuperBannerDraft;
    sendsToday: number;
    sendWindowKey: string;
    pendingPaymentId: string | null;
    pendingCheckoutRail: MembershipCheckoutRail | null;
    pendingCryptoAsset: MembershipCryptoAsset | null;
    updatedAtMs: number;
  };
  hubFeatured: {
    status: PromotionPurchaseStatus;
    duration: PromotionDuration | null;
    expiresAtMs: number | null;
    pendingPaymentId: string | null;
    pendingCheckoutRail: MembershipCheckoutRail | null;
    pendingCryptoAsset: MembershipCryptoAsset | null;
    updatedAtMs: number;
  };
  partnerCarousel: {
    ticket: PartnerCarouselTicket | null;
    pendingPaymentId: string | null;
    pendingCheckoutRail: MembershipCheckoutRail | null;
    pendingCryptoAsset: MembershipCryptoAsset | null;
    updatedAtMs: number;
  };
};

type ChannelOwnerPromotionsRootState = {
  byChannel: Record<string, ChannelOwnerPromotionsState>;
};

const STORAGE_KEY = 'nami.channel-owner.promotions';

const SUPER_BANNER_DAILY_LIMIT = 2;

let cachedRootState: ChannelOwnerPromotionsRootState | null = null;
let cachedPromotionsStorageRaw: string | null | undefined;
let cachedSuperBannerWindowKey: string | null = null;
const cachedChannelBundles = new Map<string, ChannelOwnerPromotionsState>();

function invalidatePromotionsCache(): void {
  cachedRootState = null;
  cachedPromotionsStorageRaw = undefined;
  cachedSuperBannerWindowKey = null;
  cachedChannelBundles.clear();
}

export const PROMOTION_DURATION_LABELS: Record<PromotionDuration, string> = {
  '24h': '24 hours',
  '72h': '72 hours',
  weekly: '1 week',
};

export const PROMOTION_DURATION_PRICES_USD: Record<
  PromotionProduct,
  Record<PromotionDuration, number>
> = {
  'super-banner': {
    '24h': 49,
    '72h': 49,
    weekly: 49,
  },
  'hub-featured': {
    '24h': 79,
    '72h': 199,
    weekly: 399,
  },
  'partner-carousel': {
    '24h': 99,
    '72h': 249,
    weekly: 499,
  },
};

function defaultSuperBannerDraft(): SuperBannerDraft {
  return {
    coverUrl: '',
    headline: '',
    body: '',
  };
}

function defaultChannelPromotionBundle(): ChannelOwnerPromotionsState {
  return {
    superBanner: {
      status: 'inactive',
      draft: defaultSuperBannerDraft(),
      sendsToday: 0,
      sendWindowKey: currentSuperBannerWindowKey(),
      pendingPaymentId: null,
      pendingCheckoutRail: null,
      pendingCryptoAsset: null,
      updatedAtMs: Date.now(),
    },
    hubFeatured: {
      status: 'inactive',
      duration: null,
      expiresAtMs: null,
      pendingPaymentId: null,
      pendingCheckoutRail: null,
      pendingCryptoAsset: null,
      updatedAtMs: Date.now(),
    },
    partnerCarousel: {
      ticket: null,
      pendingPaymentId: null,
      pendingCheckoutRail: null,
      pendingCryptoAsset: null,
      updatedAtMs: Date.now(),
    },
  };
}

function defaultRootState(): ChannelOwnerPromotionsRootState {
  return { byChannel: {} };
}

function normalizeChannelId(channelId: string): string {
  return channelId.trim();
}

function mergeChannelPromotionBundle(
  partial: Partial<ChannelOwnerPromotionsState> | undefined,
): ChannelOwnerPromotionsState {
  const defaults = defaultChannelPromotionBundle();

  return normalizeSuperBannerWindow({
    ...defaults,
    ...partial,
    superBanner: {
      ...defaults.superBanner,
      ...(partial?.superBanner ?? {}),
      draft: {
        ...defaultSuperBannerDraft(),
        ...(partial?.superBanner?.draft ?? {}),
      },
    },
    hubFeatured: {
      ...defaults.hubFeatured,
      ...(partial?.hubFeatured ?? {}),
    },
    partnerCarousel: {
      ...defaults.partnerCarousel,
      ...(partial?.partnerCarousel ?? {}),
      ticket: partial?.partnerCarousel?.ticket ?? null,
    },
  });
}

function isLegacyPromotionState(value: unknown): value is ChannelOwnerPromotionsState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'superBanner' in value && !('byChannel' in value);
}

function migrateLegacyPromotionState(legacy: ChannelOwnerPromotionsState): ChannelOwnerPromotionsRootState {
  const channelId =
    legacy.partnerCarousel.ticket?.channelId ??
    readOwnedGameChannelId() ??
    '_legacy';

  return {
    byChannel: {
      [channelId]: mergeChannelPromotionBundle(legacy),
    },
  };
}

export function formatPromotionTimeRemaining(expiresAtMs: number | null, now = Date.now()): string | null {
  if (!expiresAtMs || expiresAtMs <= now) {
    return null;
  }

  const remainingMs = expiresAtMs - now;
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return days + 'd ' + hours + 'h left';
  }

  if (hours > 0) {
    return hours + 'h ' + minutes + 'm left';
  }

  return minutes + 'm left';
}

function buildOwnerPromotionStatuses(
  channelId: string,
  state: ChannelOwnerPromotionsState,
  now = Date.now(),
): OwnerPromotionStatus[] {
  const normalized = normalizeSuperBannerWindow(state);
  const statuses: OwnerPromotionStatus[] = [];
  const superGate = canSendSuperBanner(channelId);

  if (normalized.superBanner.status === 'active') {
    statuses.push({
      id: 'super-banner',
      label: 'Super Banner',
      detail: superGate.remaining + ' of 2 sends left today',
      expiresAtMs: null,
      remainingLabel: 'Daily quota · resets 12:00 PM CT',
      isActive: true,
    });
  }

  if (
    normalized.hubFeatured.status === 'active' &&
    normalized.hubFeatured.expiresAtMs &&
    normalized.hubFeatured.expiresAtMs > now
  ) {
    statuses.push({
      id: 'hub-featured',
      label: 'Hub Featured',
      detail: 'Featured placement in Nami Hub',
      expiresAtMs: normalized.hubFeatured.expiresAtMs,
      remainingLabel: formatPromotionTimeRemaining(normalized.hubFeatured.expiresAtMs, now),
      isActive: true,
    });
  }

  const ticket = normalized.partnerCarousel.ticket;

  if (ticket?.status === 'submitted') {
    statuses.push({
      id: 'partner-carousel',
      label: 'Partner Carousel',
      detail: 'Ticket submitted for Nami Official review',
      expiresAtMs: null,
      remainingLabel: 'Pending approval',
      isActive: false,
    });
  }

  if (ticket?.status === 'approved' && ticket.expiresAtMs && ticket.expiresAtMs > now) {
    statuses.push({
      id: 'partner-carousel-live',
      label: 'Partner Carousel',
      detail: ticket.title || 'Live partner banner',
      expiresAtMs: ticket.expiresAtMs,
      remainingLabel: formatPromotionTimeRemaining(ticket.expiresAtMs, now),
      isActive: true,
    });
  }

  return statuses;
}

export function readOwnerPromotionStatuses(channelId?: string, now = Date.now()): OwnerPromotionStatus[] {
  const root = readChannelOwnerPromotionsRootState();

  if (channelId) {
    return buildOwnerPromotionStatuses(channelId, readChannelOwnerPromotionsState(channelId), now);
  }

  return Object.entries(root.byChannel).flatMap(([entryChannelId, bundle]) =>
    buildOwnerPromotionStatuses(entryChannelId, bundle, now),
  );
}

function durationToMs(duration: PromotionDuration): number {
  if (duration === '24h') {
    return 24 * 60 * 60 * 1000;
  }

  if (duration === '72h') {
    return 72 * 60 * 60 * 1000;
  }

  return 7 * 24 * 60 * 60 * 1000;
}

/** Daily super-banner quota resets at 12:00 PM US Central. */
export function currentSuperBannerWindowKey(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date(now));

  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');

  if (hour < 12) {
    const prior = new Date(Date.UTC(year, month - 1, day));
    prior.setUTCDate(prior.getUTCDate() - 1);

    return (
      prior.getUTCFullYear() +
      '-' +
      String(prior.getUTCMonth() + 1).padStart(2, '0') +
      '-' +
      String(prior.getUTCDate()).padStart(2, '0')
    );
  }

  return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function normalizeSuperBannerWindow(state: ChannelOwnerPromotionsState): ChannelOwnerPromotionsState {
  const windowKey = currentSuperBannerWindowKey();

  if (state.superBanner.sendWindowKey === windowKey) {
    return state;
  }

  return {
    ...state,
    superBanner: {
      ...state.superBanner,
      sendsToday: 0,
      sendWindowKey: windowKey,
    },
  };
}

async function compactPromotionCoverUrls(
  channelId: string,
  state: ChannelOwnerPromotionsState,
): Promise<ChannelOwnerPromotionsState> {
  const partnerCover = state.partnerCarousel.ticket?.coverUrl ?? '';
  const superCover = state.superBanner.draft.coverUrl;

  const [partnerCoverRef, superCoverRef] = await Promise.all([
    partnerCover
      ? externalizePromotionCoverUrl(channelId, partnerCover, PARTNER_CAROUSEL_COVER_PREFIX)
      : Promise.resolve(''),
    superCover
      ? externalizePromotionCoverUrl(channelId, superCover, SUPER_BANNER_COVER_PREFIX)
      : Promise.resolve(''),
  ]);

  return {
    ...state,
    superBanner: {
      ...state.superBanner,
      draft: {
        ...state.superBanner.draft,
        coverUrl: superCoverRef || superCover,
      },
    },
    partnerCarousel: {
      ...state.partnerCarousel,
      ticket: state.partnerCarousel.ticket
        ? {
            ...state.partnerCarousel.ticket,
            channelId,
            coverUrl: partnerCoverRef || partnerCover,
          }
        : null,
    },
  };
}

function loadChannelOwnerPromotionsRootState(): ChannelOwnerPromotionsRootState {
  const defaults = defaultRootState();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as Partial<ChannelOwnerPromotionsRootState> | ChannelOwnerPromotionsState;

    if (isLegacyPromotionState(parsed)) {
      return migrateLegacyPromotionState(parsed);
    }

    const byChannel = Object.fromEntries(
      Object.entries(parsed.byChannel ?? {}).map(([channelId, bundle]) => [
        channelId,
        mergeChannelPromotionBundle(bundle),
      ]),
    );

    const loaded: ChannelOwnerPromotionsRootState = { byChannel };

    for (const [channelId, bundle] of Object.entries(byChannel)) {
      if (
        bundle.partnerCarousel.ticket?.coverUrl?.startsWith('data:') ||
        bundle.superBanner.draft.coverUrl.startsWith('data:')
      ) {
        void compactPromotionCoverUrls(channelId, bundle).then((compactState) => {
          updateChannelPromotionBundle(channelId, () => compactState);
        });
      }
    }

    return loaded;
  } catch {
    return defaults;
  }
}

export function readChannelOwnerPromotionsRootState(): ChannelOwnerPromotionsRootState {
  const windowKey = currentSuperBannerWindowKey();
  let storageRaw: string | null = null;

  try {
    storageRaw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storageRaw = null;
  }

  if (
    cachedRootState &&
    cachedPromotionsStorageRaw === storageRaw &&
    cachedSuperBannerWindowKey === windowKey
  ) {
    return cachedRootState;
  }

  cachedRootState = loadChannelOwnerPromotionsRootState();
  cachedPromotionsStorageRaw = storageRaw;
  cachedSuperBannerWindowKey = windowKey;
  cachedChannelBundles.clear();

  return cachedRootState;
}

export function readChannelOwnerPromotionsState(channelId: string): ChannelOwnerPromotionsState {
  const normalizedChannelId = normalizeChannelId(channelId);
  const cached = cachedChannelBundles.get(normalizedChannelId);

  if (cached) {
    return cached;
  }

  const root = readChannelOwnerPromotionsRootState();
  const bundle = normalizeSuperBannerWindow(
    root.byChannel[normalizedChannelId] ?? defaultChannelPromotionBundle(),
  );

  cachedChannelBundles.set(normalizedChannelId, bundle);
  return bundle;
}

function saveChannelOwnerPromotionsRootState(root: ChannelOwnerPromotionsRootState): void {
  cachedRootState = root;
  cachedChannelBundles.clear();
  cachedSuperBannerWindowKey = currentSuperBannerWindowKey();
  window.dispatchEvent(new CustomEvent('nami-channel-owner-promotions-changed'));

  void (async () => {
    const compactEntries = await Promise.all(
      Object.entries(root.byChannel).map(async ([channelId, bundle]) => [
        channelId,
        await compactPromotionCoverUrls(channelId, bundle),
      ] as const),
    );

    const compactRoot: ChannelOwnerPromotionsRootState = {
      byChannel: Object.fromEntries(compactEntries),
    };
    const serialized = JSON.stringify(compactRoot);

    window.localStorage.setItem(STORAGE_KEY, serialized);
    cachedRootState = compactRoot;
    cachedPromotionsStorageRaw = serialized;
    cachedChannelBundles.clear();
    window.dispatchEvent(new CustomEvent('nami-channel-owner-promotions-changed'));
  })();
}

function updateChannelPromotionBundle(
  channelId: string,
  updater: (current: ChannelOwnerPromotionsState) => ChannelOwnerPromotionsState,
): void {
  const normalizedChannelId = normalizeChannelId(channelId);
  const root = readChannelOwnerPromotionsRootState();
  const current = root.byChannel[normalizedChannelId] ?? defaultChannelPromotionBundle();
  const next = updater(current);

  saveChannelOwnerPromotionsRootState({
    byChannel: {
      ...root.byChannel,
      [normalizedChannelId]: next,
    },
  });
}

function partnerCarouselCoverRefMatchesChannel(channelId: string, storedCover: string): boolean {
  if (!storedCover.startsWith(CHANNEL_MEDIA_REF_PREFIX)) {
    return true;
  }

  const refKey = storedCover.slice(CHANNEL_MEDIA_REF_PREFIX.length);
  return refKey === 'nami.channel.partner-carousel-cover.' + channelId;
}

export function resolvePartnerCarouselCoverUrl(
  channelId: string,
  ticket: PartnerCarouselTicket | null | undefined = readPartnerCarouselTicket(channelId),
): string {
  const normalizedChannelId = channelId.trim();
  const fromStorage = readPartnerCarouselCoverUrl(normalizedChannelId);

  if (fromStorage) {
    return fromStorage;
  }

  const storedCover = ticket?.coverUrl?.trim() ?? '';

  if (
    storedCover &&
    ticket?.channelId === normalizedChannelId &&
    partnerCarouselCoverRefMatchesChannel(normalizedChannelId, storedCover)
  ) {
    const resolved = resolveChannelMediaRef(storedCover);

    if (resolved) {
      return resolved;
    }
  }

  return '';
}

export function partnerCarouselCoverHydrationKey(
  channelId: string,
  ticket: PartnerCarouselTicket | null | undefined = readPartnerCarouselTicket(channelId),
): string | null {
  const storedCover = ticket?.coverUrl?.trim() ?? '';

  if (
    storedCover.startsWith(CHANNEL_MEDIA_REF_PREFIX) &&
    partnerCarouselCoverRefMatchesChannel(channelId, storedCover)
  ) {
    return storedCover.slice(CHANNEL_MEDIA_REF_PREFIX.length);
  }

  if (channelId.trim()) {
    return 'nami.channel.partner-carousel-cover.' + channelId.trim();
  }

  return null;
}

export function resolveSuperBannerCoverUrl(channelId: string, coverUrl: string): string {
  const trimmed = coverUrl.trim();

  if (trimmed) {
    const resolved = resolveChannelMediaRef(trimmed);

    if (resolved) {
      return resolved;
    }
  }

  return readSuperBannerCoverUrl(channelId) ?? '';
}

export type PromotionActionResult =
  | { ok: true; message: string }
  | { ok: false; reason: string };

export function formatPromotionPrice(product: PromotionProduct, duration: PromotionDuration): string {
  return '$' + PROMOTION_DURATION_PRICES_USD[product][duration].toFixed(0) + ' USD';
}

function findChannelIdForPendingPayment(
  product: PromotionProduct,
  paymentId: string,
): string | null {
  const root = readChannelOwnerPromotionsRootState();

  for (const [channelId, bundle] of Object.entries(root.byChannel)) {
    if (product === 'super-banner' && bundle.superBanner.pendingPaymentId === paymentId) {
      return channelId;
    }

    if (product === 'hub-featured' && bundle.hubFeatured.pendingPaymentId === paymentId) {
      return channelId;
    }

    if (product === 'partner-carousel' && bundle.partnerCarousel.pendingPaymentId === paymentId) {
      return channelId;
    }
  }

  return null;
}

export function requestPromotionPurchase(
  channelId: string,
  product: PromotionProduct,
  duration: PromotionDuration,
  checkoutRail: MembershipCheckoutRail = 'card',
  cryptoAsset: MembershipCryptoAsset | null = null,
): PromotionActionResult {
  const purchaseCapability =
    product === 'partner-carousel' ? 'submit-partner-ticket' : 'purchase-promotions';

  if (!preApprovedOwnerCapabilityAllowed(purchaseCapability, channelId)) {
    return {
      ok: false,
      reason: preApprovedOwnerRestrictionMessage(
        product === 'partner-carousel' ? 'Partner banner ticket submission' : 'Promotion purchases',
      ),
    };
  }

  const state = readChannelOwnerPromotionsState(channelId);

  if (checkoutRail === 'other' && !cryptoAsset) {
    return { ok: false, reason: 'Choose SUI, USDC on Sui, or $GOON under Other.' };
  }

  const paymentId = 'promo-' + product + '-' + Date.now();

  if (product === 'super-banner') {
    updateChannelPromotionBundle(channelId, (current) => ({
      ...current,
      superBanner: {
        ...current.superBanner,
        status: 'pending-payment',
        pendingPaymentId: paymentId,
        pendingCheckoutRail: checkoutRail,
        pendingCryptoAsset: checkoutRail === 'other' ? cryptoAsset : null,
        updatedAtMs: Date.now(),
      },
    }));
  } else if (product === 'hub-featured') {
    updateChannelPromotionBundle(channelId, (current) => ({
      ...current,
      hubFeatured: {
        ...current.hubFeatured,
        status: 'pending-payment',
        duration,
        pendingPaymentId: paymentId,
        pendingCheckoutRail: checkoutRail,
        pendingCryptoAsset: checkoutRail === 'other' ? cryptoAsset : null,
        updatedAtMs: Date.now(),
      },
    }));
  } else {
    const ticket: PartnerCarouselTicket = state.partnerCarousel.ticket ?? {
      id: 'partner-ticket-' + channelId,
      channelId,
      coverUrl: '',
      title: '',
      description: '',
      duration,
      status: 'draft',
      submittedAtMs: null,
      expiresAtMs: null,
      updatedAtMs: Date.now(),
    };

    updateChannelPromotionBundle(channelId, (current) => ({
      ...current,
      partnerCarousel: {
        ...current.partnerCarousel,
        ticket: { ...ticket, channelId, duration, updatedAtMs: Date.now() },
        pendingPaymentId: paymentId,
        pendingCheckoutRail: checkoutRail,
        pendingCryptoAsset: checkoutRail === 'other' ? cryptoAsset : null,
        updatedAtMs: Date.now(),
      },
    }));
  }

  return {
    ok: true,
    message:
      'Checkout queued for ' +
      PROMOTION_DURATION_LABELS[duration] +
      ' (' +
      formatPromotionPrice(product, duration) +
      '). Continue to payment.',
  };
}

export function confirmPromotionPurchase(
  product: PromotionProduct,
  paymentId: string,
): PromotionActionResult {
  const channelId = findChannelIdForPendingPayment(product, paymentId);

  if (!channelId) {
    return { ok: false, reason: 'Payment does not match an active promotion checkout.' };
  }

  const purchaseCapability =
    product === 'partner-carousel' ? 'submit-partner-ticket' : 'purchase-promotions';

  if (!preApprovedOwnerCapabilityAllowed(purchaseCapability, channelId)) {
    return {
      ok: false,
      reason: preApprovedOwnerRestrictionMessage(
        product === 'partner-carousel' ? 'Partner banner ticket submission' : 'Promotion purchases',
      ),
    };
  }

  const state = readChannelOwnerPromotionsState(channelId);

  if (!isMockMembershipCheckoutEnabled()) {
    return {
      ok: false,
      reason: 'Complete checkout through the payment API. Local mock checkout is disabled.',
    };
  }

  if (product === 'super-banner') {
    if (state.superBanner.pendingPaymentId !== paymentId) {
      return { ok: false, reason: 'Payment does not match the active Super Banner checkout.' };
    }

    updateChannelPromotionBundle(channelId, (current) => ({
      ...current,
      superBanner: {
        ...current.superBanner,
        status: 'active',
        pendingPaymentId: null,
        pendingCheckoutRail: null,
        pendingCryptoAsset: null,
        updatedAtMs: Date.now(),
      },
    }));

    return { ok: true, message: 'Super Banner unlocked. Edit your banner and send up to 2 per day.' };
  }

  if (product === 'hub-featured') {
    if (state.hubFeatured.pendingPaymentId !== paymentId) {
      return { ok: false, reason: 'Payment does not match the active Hub Featured checkout.' };
    }

    const duration = state.hubFeatured.duration ?? '24h';

    updateChannelPromotionBundle(channelId, (current) => ({
      ...current,
      hubFeatured: {
        ...current.hubFeatured,
        status: 'active',
        expiresAtMs: Date.now() + durationToMs(duration),
        pendingPaymentId: null,
        pendingCheckoutRail: null,
        pendingCryptoAsset: null,
        updatedAtMs: Date.now(),
      },
    }));

    return { ok: true, message: 'Hub Featured spot active for ' + PROMOTION_DURATION_LABELS[duration] + '.' };
  }

  if (state.partnerCarousel.pendingPaymentId !== paymentId) {
    return { ok: false, reason: 'Payment does not match the active Partner Carousel checkout.' };
  }

  const ticket = state.partnerCarousel.ticket;

  if (!ticket) {
    return { ok: false, reason: 'Create your partner banner draft before checkout.' };
  }

  const submittedTicket: PartnerCarouselTicket = {
    ...ticket,
    channelId,
    status: 'submitted',
    submittedAtMs: Date.now(),
    expiresAtMs: null,
    updatedAtMs: Date.now(),
  };

  updateChannelPromotionBundle(channelId, (current) => ({
    ...current,
    partnerCarousel: {
      ...current.partnerCarousel,
      ticket: submittedTicket,
      pendingPaymentId: null,
      pendingCheckoutRail: null,
      pendingCryptoAsset: null,
      updatedAtMs: Date.now(),
    },
  }));

  window.dispatchEvent(
    new CustomEvent('nami-partner-banner-ticket-updated', {
      detail: submittedTicket,
    }),
  );

  return {
    ok: true,
    message: 'Partner carousel ticket submitted for Nami Official review.',
  };
}

export function applyPartnerBannerOfficialReview(
  ticketId: string,
  status: 'approved' | 'rejected',
  expiresAtMs: number | null,
): boolean {
  const root = readChannelOwnerPromotionsRootState();

  for (const [channelId, bundle] of Object.entries(root.byChannel)) {
    const ticket = bundle.partnerCarousel.ticket;

    if (!ticket || ticket.id !== ticketId) {
      continue;
    }

    updateChannelPromotionBundle(channelId, (current) => ({
      ...current,
      partnerCarousel: {
        ...current.partnerCarousel,
        ticket: {
          ...ticket,
          status,
          expiresAtMs: status === 'approved' ? expiresAtMs : null,
          updatedAtMs: Date.now(),
        },
        updatedAtMs: Date.now(),
      },
    }));

    return true;
  }

  return false;
}

export function saveSuperBannerDraft(channelId: string, draft: SuperBannerDraft): void {
  updateChannelPromotionBundle(channelId, (current) => ({
    ...current,
    superBanner: {
      ...current.superBanner,
      draft: {
        coverUrl: draft.coverUrl,
        headline: draft.headline,
        body: draft.body,
      },
      updatedAtMs: Date.now(),
    },
  }));

  if (draft.coverUrl.trim()) {
    void externalizePromotionCoverUrl(channelId, draft.coverUrl, SUPER_BANNER_COVER_PREFIX).then(
      (coverUrl) => {
        updateChannelPromotionBundle(channelId, (current) => ({
          ...current,
          superBanner: {
            ...current.superBanner,
            draft: {
              ...current.superBanner.draft,
              coverUrl,
            },
            updatedAtMs: Date.now(),
          },
        }));
      },
    );
  }
}

export function canSendSuperBanner(channelId: string): { ok: boolean; remaining: number; reason?: string } {
  const state = normalizeSuperBannerWindow(readChannelOwnerPromotionsState(channelId));

  if (state.superBanner.status !== 'active') {
    return { ok: false, remaining: 0, reason: 'Purchase Super Banner access before sending.' };
  }

  const remaining = Math.max(0, SUPER_BANNER_DAILY_LIMIT - state.superBanner.sendsToday);

  if (remaining === 0) {
    return {
      ok: false,
      remaining: 0,
      reason: 'Daily Super Banner limit reached. Resets at 12:00 PM Central.',
    };
  }

  return { ok: true, remaining };
}

export function sendSuperBanner(channelId: string): PromotionActionResult {
  if (!preApprovedOwnerCapabilityAllowed('send-banners', channelId)) {
    return {
      ok: false,
      reason: preApprovedOwnerRestrictionMessage('Sending Super Banners'),
    };
  }

  const state = normalizeSuperBannerWindow(readChannelOwnerPromotionsState(channelId));
  const gate = canSendSuperBanner(channelId);

  if (!gate.ok) {
    return { ok: false, reason: gate.reason ?? 'Cannot send Super Banner.' };
  }

  const draft = state.superBanner.draft;

  if (!draft.headline.trim() || !draft.body.trim()) {
    return { ok: false, reason: 'Add a headline and message before sending your Super Banner.' };
  }

  updateChannelPromotionBundle(channelId, (current) => ({
    ...current,
    superBanner: {
      ...current.superBanner,
      sendsToday: current.superBanner.sendsToday + 1,
      updatedAtMs: Date.now(),
    },
  }));

  window.dispatchEvent(
    new CustomEvent('nami-super-banner-sent', {
      detail: {
        channelId,
        coverUrl: draft.coverUrl,
        headline: draft.headline,
        body: draft.body,
        sentAtMs: Date.now(),
      },
    }),
  );

  return {
    ok: true,
    message:
      'Super Banner sent to all members (' +
      (gate.remaining - 1) +
      ' of ' +
      SUPER_BANNER_DAILY_LIMIT +
      ' sends left today).',
  };
}

function buildPartnerCarouselTicket(
  channelId: string,
  state: ChannelOwnerPromotionsState,
  patch: Partial<PartnerCarouselTicket>,
  coverUrl: string,
): PartnerCarouselTicket {
  return {
    ...(state.partnerCarousel.ticket ?? {
      id: 'partner-ticket-' + channelId,
      channelId,
      coverUrl: '',
      title: '',
      description: '',
      duration: '72h' as PromotionDuration,
      status: 'draft' as const,
      submittedAtMs: null,
      expiresAtMs: null,
      updatedAtMs: Date.now(),
    }),
    ...patch,
    coverUrl,
    channelId,
    updatedAtMs: Date.now(),
  };
}

export function savePartnerCarouselTicket(
  channelId: string,
  patch: Partial<PartnerCarouselTicket>,
): PromotionActionResult {
  const state = readChannelOwnerPromotionsState(channelId);
  const nextCoverUrl = patch.coverUrl;
  const immediateCoverUrl =
    typeof nextCoverUrl === 'string' && nextCoverUrl.trim() !== ''
      ? nextCoverUrl
      : state.partnerCarousel.ticket?.coverUrl ?? '';

  updateChannelPromotionBundle(channelId, (current) => ({
    ...current,
    partnerCarousel: {
      ...current.partnerCarousel,
      ticket: buildPartnerCarouselTicket(channelId, current, patch, immediateCoverUrl),
      updatedAtMs: Date.now(),
    },
  }));

  if (typeof nextCoverUrl === 'string' && nextCoverUrl.trim() !== '') {
    void externalizePromotionCoverUrl(channelId, nextCoverUrl, PARTNER_CAROUSEL_COVER_PREFIX).then(
      (coverUrl) => {
        updateChannelPromotionBundle(channelId, (current) => ({
          ...current,
          partnerCarousel: {
            ...current.partnerCarousel,
            ticket: buildPartnerCarouselTicket(channelId, current, patch, coverUrl),
            updatedAtMs: Date.now(),
          },
        }));
      },
    );
  }

  return { ok: true, message: 'Partner banner draft saved.' };
}

export function readActiveHubFeaturedChannelId(now = Date.now()): string | null {
  const root = readChannelOwnerPromotionsRootState();

  for (const [channelId, bundle] of Object.entries(root.byChannel)) {
    const featured = bundle.hubFeatured;

    if (featured.status === 'active' && featured.expiresAtMs && featured.expiresAtMs > now) {
      return channelId;
    }
  }

  return null;
}

export function readApprovedPartnerCarouselChannelIds(now = Date.now()): string[] {
  const root = readChannelOwnerPromotionsRootState();

  return Object.entries(root.byChannel).flatMap(([channelId, bundle]) => {
    const ticket = bundle.partnerCarousel.ticket;

    if (!ticket || ticket.status !== 'approved' || !ticket.expiresAtMs || ticket.expiresAtMs <= now) {
      return [];
    }

    return [channelId];
  });
}

export function readPartnerCarouselTicket(channelId: string): PartnerCarouselTicket | null {
  return readChannelOwnerPromotionsState(channelId).partnerCarousel.ticket;
}

export function readPartnerCarouselDisplayChannelId(now = Date.now()): string | null {
  const approved = readApprovedPartnerCarouselChannelIds(now);

  if (approved.length > 0) {
    return approved[0] ?? null;
  }

  const root = readChannelOwnerPromotionsRootState();

  for (const [channelId, bundle] of Object.entries(root.byChannel)) {
    const status = bundle.partnerCarousel.ticket?.status;

    if (status === 'submitted' || status === 'approved') {
      return channelId;
    }
  }

  return null;
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    invalidatePromotionsCache();
    listener();
  }

  window.addEventListener('nami-channel-owner-promotions-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-channel-owner-promotions-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function resetChannelOwnerPromotionsStateForTests(): void {
  invalidatePromotionsCache();

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}

export function useChannelOwnerPromotionsState(channelId: string): ChannelOwnerPromotionsState {
  return useSyncExternalStore(
    subscribe,
    () => readChannelOwnerPromotionsState(channelId),
    () => readChannelOwnerPromotionsState(channelId),
  );
}
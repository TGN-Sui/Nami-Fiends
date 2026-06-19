import { useSyncExternalStore } from 'react';

import { isMockMembershipCheckoutEnabled } from './app-config.js';
import { readOwnedGameChannelId } from './channel-owner-access.js';
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

const STORAGE_KEY = 'nami.channel-owner.promotions';

const SUPER_BANNER_DAILY_LIMIT = 2;

let cachedPromotionsState: ChannelOwnerPromotionsState | null = null;
let cachedPromotionsStorageRaw: string | null | undefined;
let cachedSuperBannerWindowKey: string | null = null;

function invalidatePromotionsCache(): void {
  cachedPromotionsState = null;
  cachedPromotionsStorageRaw = undefined;
  cachedSuperBannerWindowKey = null;
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

function defaultState(): ChannelOwnerPromotionsState {
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

export function readOwnerPromotionStatuses(now = Date.now()): OwnerPromotionStatus[] {
  const state = normalizeSuperBannerWindow(readChannelOwnerPromotionsState());
  const statuses: OwnerPromotionStatus[] = [];
  const superGate = canSendSuperBanner();

  if (state.superBanner.status === 'active') {
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
    state.hubFeatured.status === 'active' &&
    state.hubFeatured.expiresAtMs &&
    state.hubFeatured.expiresAtMs > now
  ) {
    statuses.push({
      id: 'hub-featured',
      label: 'Hub Featured',
      detail: 'Featured placement in Nami Hub',
      expiresAtMs: state.hubFeatured.expiresAtMs,
      remainingLabel: formatPromotionTimeRemaining(state.hubFeatured.expiresAtMs, now),
      isActive: true,
    });
  }

  const ticket = state.partnerCarousel.ticket;

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

  if (
    ticket?.status === 'approved' &&
    ticket.expiresAtMs &&
    ticket.expiresAtMs > now
  ) {
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

function loadChannelOwnerPromotionsState(): ChannelOwnerPromotionsState {
  const defaults = defaultState();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return normalizeSuperBannerWindow(defaults);
    }

    const parsed = JSON.parse(stored) as Partial<ChannelOwnerPromotionsState>;

    return normalizeSuperBannerWindow({
      ...defaults,
      ...parsed,
      superBanner: {
        ...defaults.superBanner,
        ...(parsed.superBanner ?? {}),
        draft: {
          ...defaultSuperBannerDraft(),
          ...(parsed.superBanner?.draft ?? {}),
        },
      },
      hubFeatured: {
        ...defaults.hubFeatured,
        ...(parsed.hubFeatured ?? {}),
      },
      partnerCarousel: {
        ...defaults.partnerCarousel,
        ...(parsed.partnerCarousel ?? {}),
        ticket: parsed.partnerCarousel?.ticket ?? null,
      },
    });
  } catch {
    return normalizeSuperBannerWindow(defaults);
  }
}

export function readChannelOwnerPromotionsState(): ChannelOwnerPromotionsState {
  const windowKey = currentSuperBannerWindowKey();
  let storageRaw: string | null = null;

  try {
    storageRaw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storageRaw = null;
  }

  if (
    cachedPromotionsState &&
    cachedPromotionsStorageRaw === storageRaw &&
    cachedSuperBannerWindowKey === windowKey
  ) {
    return cachedPromotionsState;
  }

  cachedPromotionsState = loadChannelOwnerPromotionsState();
  cachedPromotionsStorageRaw = storageRaw;
  cachedSuperBannerWindowKey = windowKey;

  return cachedPromotionsState;
}

export function saveChannelOwnerPromotionsState(state: ChannelOwnerPromotionsState): void {
  const serialized = JSON.stringify(state);

  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedPromotionsState = state;
  cachedPromotionsStorageRaw = serialized;
  cachedSuperBannerWindowKey = currentSuperBannerWindowKey();
  window.dispatchEvent(new CustomEvent('nami-channel-owner-promotions-changed'));
}

export type PromotionActionResult =
  | { ok: true; message: string }
  | { ok: false; reason: string };

export function formatPromotionPrice(product: PromotionProduct, duration: PromotionDuration): string {
  return '$' + PROMOTION_DURATION_PRICES_USD[product][duration].toFixed(0) + ' USD';
}

export function requestPromotionPurchase(
  channelId: string,
  product: PromotionProduct,
  duration: PromotionDuration,
  checkoutRail: MembershipCheckoutRail = 'card',
  cryptoAsset: MembershipCryptoAsset | null = null
): PromotionActionResult {
  const state = readChannelOwnerPromotionsState();

  if (checkoutRail === 'other' && !cryptoAsset) {
    return { ok: false, reason: 'Choose SUI, USDC on Sui, or $GOON under Other.' };
  }

  const paymentId = 'promo-' + product + '-' + Date.now();

  if (product === 'super-banner') {
    saveChannelOwnerPromotionsState({
      ...state,
      superBanner: {
        ...state.superBanner,
        status: 'pending-payment',
        pendingPaymentId: paymentId,
        pendingCheckoutRail: checkoutRail,
        pendingCryptoAsset: checkoutRail === 'other' ? cryptoAsset : null,
        updatedAtMs: Date.now(),
      },
    });
  } else if (product === 'hub-featured') {
    saveChannelOwnerPromotionsState({
      ...state,
      hubFeatured: {
        ...state.hubFeatured,
        status: 'pending-payment',
        duration,
        pendingPaymentId: paymentId,
        pendingCheckoutRail: checkoutRail,
        pendingCryptoAsset: checkoutRail === 'other' ? cryptoAsset : null,
        updatedAtMs: Date.now(),
      },
    });
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

    saveChannelOwnerPromotionsState({
      ...state,
      partnerCarousel: {
        ...state.partnerCarousel,
        ticket: { ...ticket, duration, updatedAtMs: Date.now() },
        pendingPaymentId: paymentId,
        pendingCheckoutRail: checkoutRail,
        pendingCryptoAsset: checkoutRail === 'other' ? cryptoAsset : null,
        updatedAtMs: Date.now(),
      },
    });
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
  paymentId: string
): PromotionActionResult {
  const state = readChannelOwnerPromotionsState();

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

    saveChannelOwnerPromotionsState({
      ...state,
      superBanner: {
        ...state.superBanner,
        status: 'active',
        pendingPaymentId: null,
        pendingCheckoutRail: null,
        pendingCryptoAsset: null,
        updatedAtMs: Date.now(),
      },
    });

    return { ok: true, message: 'Super Banner unlocked. Edit your banner and send up to 2 per day.' };
  }

  if (product === 'hub-featured') {
    if (state.hubFeatured.pendingPaymentId !== paymentId) {
      return { ok: false, reason: 'Payment does not match the active Hub Featured checkout.' };
    }

    const duration = state.hubFeatured.duration ?? '24h';

    saveChannelOwnerPromotionsState({
      ...state,
      hubFeatured: {
        ...state.hubFeatured,
        status: 'active',
        expiresAtMs: Date.now() + durationToMs(duration),
        pendingPaymentId: null,
        pendingCheckoutRail: null,
        pendingCryptoAsset: null,
        updatedAtMs: Date.now(),
      },
    });

    return { ok: true, message: 'Hub Featured spot active for ' + PROMOTION_DURATION_LABELS[duration] + '.' };
  }

  if (state.partnerCarousel.pendingPaymentId !== paymentId) {
    return { ok: false, reason: 'Payment does not match the active Partner Carousel checkout.' };
  }

  const ticket = state.partnerCarousel.ticket;

  if (!ticket) {
    return { ok: false, reason: 'Create your partner banner draft before checkout.' };
  }

  const approvedForMock =
    isMockMembershipCheckoutEnabled() &&
    ticket.title.trim().length > 0 &&
    ticket.description.trim().length > 0;

  saveChannelOwnerPromotionsState({
    ...state,
    partnerCarousel: {
      ...state.partnerCarousel,
      ticket: {
        ...ticket,
        status: approvedForMock ? 'approved' : 'submitted',
        submittedAtMs: Date.now(),
        expiresAtMs: approvedForMock ? Date.now() + durationToMs(ticket.duration) : null,
        updatedAtMs: Date.now(),
      },
      pendingPaymentId: null,
      pendingCheckoutRail: null,
      pendingCryptoAsset: null,
      updatedAtMs: Date.now(),
    },
  });

  return {
    ok: true,
    message: approvedForMock
      ? 'Partner carousel approved for ' + PROMOTION_DURATION_LABELS[ticket.duration] + ' (mock).'
      : 'Partner carousel ticket submitted for Nami Official review.',
  };
}

export function saveSuperBannerDraft(channelId: string, draft: SuperBannerDraft): void {
  const state = readChannelOwnerPromotionsState();

  saveChannelOwnerPromotionsState({
    ...state,
    superBanner: {
      ...state.superBanner,
      draft: {
        coverUrl: draft.coverUrl,
        headline: draft.headline,
        body: draft.body,
      },
      updatedAtMs: Date.now(),
    },
  });

  void channelId;
}

export function canSendSuperBanner(): { ok: boolean; remaining: number; reason?: string } {
  const state = normalizeSuperBannerWindow(readChannelOwnerPromotionsState());

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
  const state = normalizeSuperBannerWindow(readChannelOwnerPromotionsState());
  const gate = canSendSuperBanner();

  if (!gate.ok) {
    return { ok: false, reason: gate.reason ?? 'Cannot send Super Banner.' };
  }

  const draft = state.superBanner.draft;

  if (!draft.headline.trim() || !draft.body.trim()) {
    return { ok: false, reason: 'Add a headline and message before sending your Super Banner.' };
  }

  saveChannelOwnerPromotionsState({
    ...state,
    superBanner: {
      ...state.superBanner,
      sendsToday: state.superBanner.sendsToday + 1,
      updatedAtMs: Date.now(),
    },
  });

  window.dispatchEvent(
    new CustomEvent('nami-super-banner-sent', {
      detail: {
        channelId,
        coverUrl: draft.coverUrl,
        headline: draft.headline,
        body: draft.body,
        sentAtMs: Date.now(),
      },
    })
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

export function savePartnerCarouselTicket(
  channelId: string,
  patch: Partial<PartnerCarouselTicket>
): PromotionActionResult {
  const state = readChannelOwnerPromotionsState();
  const ticket: PartnerCarouselTicket = {
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
    channelId,
    updatedAtMs: Date.now(),
  };

  saveChannelOwnerPromotionsState({
    ...state,
    partnerCarousel: {
      ...state.partnerCarousel,
      ticket,
      updatedAtMs: Date.now(),
    },
  });

  return { ok: true, message: 'Partner banner draft saved.' };
}

export function readActiveHubFeaturedChannelId(now = Date.now()): string | null {
  const state = readChannelOwnerPromotionsState();
  const featured = state.hubFeatured;

  if (featured.status !== 'active' || !featured.expiresAtMs || featured.expiresAtMs <= now) {
    return null;
  }

  return readOwnedGameChannelId();
}

export function readApprovedPartnerCarouselChannelIds(): string[] {
  const ticket = readChannelOwnerPromotionsState().partnerCarousel.ticket;

  if (!ticket || ticket.status !== 'approved') {
    return [];
  }

  return [ticket.channelId];
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

export function useChannelOwnerPromotionsState(): ChannelOwnerPromotionsState {
  return useSyncExternalStore(subscribe, readChannelOwnerPromotionsState, readChannelOwnerPromotionsState);
}
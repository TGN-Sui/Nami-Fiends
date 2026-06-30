import { readIndexerUrl } from './protocol-env.js';

import type { GiftCatalogEntry } from './gift-catalog.js';

export type GiftPaymentRail = 'goon_wallet' | 'card' | 'paypal' | 'other';

export type GiftTargetType = 'member' | 'stream';

export type GiftRevenueSplitPercents = {
  creator: number;
  channelOwner: number;
  platform: number;
};

export type GiftFulfillment = {
  id: string;
  intentId: string;
  giftId: string;
  giftLabel: string;
  giftTier: 'common' | 'rare' | 'legendary';
  giftEmoji: string;
  giftIconUrl?: string | null;
  animationClass: string;
  senderOwner: string;
  senderMemberId: string;
  senderMemberName: string;
  targetType: GiftTargetType;
  targetMemberId: string;
  targetMemberName: string;
  streamKey: string | null;
  streamTitle: string | null;
  channelOwnerMemberId: string | null;
  amountUsd: number;
  goonAmount: number;
  rail: GiftPaymentRail;
  revenueSplit: {
    creatorPercent: number;
    channelOwnerPercent: number;
    platformPercent: number;
    creatorAmountUsd: number;
    channelOwnerAmountUsd: number;
    platformAmountUsd: number;
    channelOwnerRolledToPlatform: boolean;
  };
  txDigest: string | null;
  createdAtMs: number;
};

export type GiftPaymentIntent = {
  id: string;
  giftId: string;
  senderOwner: string;
  senderMemberId: string;
  senderMemberName: string;
  targetType: GiftTargetType;
  targetMemberId: string;
  targetMemberName: string;
  streamKey: string | null;
  streamTitle: string | null;
  channelOwnerMemberId: string | null;
  amountUsd: number;
  goonAmount: number;
  rail: GiftPaymentRail;
  cryptoAsset: 'sui' | 'usdc' | 'goon' | null;
  status: 'created' | 'pending_provider' | 'paid' | 'failed' | 'expired';
  createdAtMs: number;
  updatedAtMs: number;
  paidAtMs: number | null;
  provider: 'stripe' | 'paypal' | 'sui_chain' | 'goon_wallet' | 'mock' | null;
  providerRef: string | null;
  txDigest: string | null;
  receiptUrl: string | null;
};

export type GiftIntentResponse = {
  intent: GiftPaymentIntent;
  card?: {
    mode: 'stripe' | 'mock';
    checkoutUrl: string | null;
    sessionId: string;
  };
  paypal?: {
    mode: 'paypal' | 'mock';
    approvalUrl: string | null;
    orderId: string;
  };
  crypto?: {
    treasuryAddress: string;
    asset: 'sui' | 'usdc' | 'goon';
    amountUsd: number;
    amountLabel: string;
    amountBaseUnits: string;
    coinType: string | null;
    paymentMemo: string;
  };
  goonWallet?: {
    treasuryAddress: string;
    goonAmount: number;
    amountBaseUnits: string;
    coinType: string;
    paymentMemo: string;
  };
};

export type GiftPublicConfig = {
  revenueSplit: GiftRevenueSplitPercents;
  catalog: GiftCatalogEntry[];
};

function giftsBaseUrl(): string | null {
  return readIndexerUrl();
}

export function formatGiftApiError(
  payload: { message?: string; error?: string },
  status: number
): string {
  const code = payload.error?.trim();

  if (code === 'not_found') {
    return status === 404
      ? 'Gift API is not available on the receiving server. Restart or redeploy the backend (npm --prefix backend run dev) so /api/gifts routes are live.'
      : 'Gift payment not found. Start checkout again.';
  }

  if (code === 'wallet_auth_invalid' || code === 'wallet_auth_required') {
    return (
      payload.message ??
      'Wallet signature required. Reconnect Google zkLogin or your Sui wallet in Settings → Account, then try again.'
    );
  }

  if (payload.message?.trim()) {
    return payload.message.trim();
  }

  if (code) {
    return code.replaceAll('_', ' ');
  }

  return 'Gift request failed.';
}

async function giftFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = giftsBaseUrl();

  if (!base) {
    throw new Error('Gift API is not configured. Set VITE_NAMI_INDEXER_URL.');
  }

  const response = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as T & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(formatGiftApiError(payload, response.status));
  }

  return payload;
}

export function isGiftApiAvailable(): boolean {
  return giftsBaseUrl() !== null;
}

export async function fetchGiftCatalog(): Promise<GiftPublicConfig> {
  return giftFetch<GiftPublicConfig>('/api/gifts/catalog');
}

export async function createGiftPaymentIntent(input: {
  senderOwner: string;
  senderMemberId: string;
  senderMemberName: string;
  giftId: string;
  targetType: GiftTargetType;
  targetMemberId: string;
  targetMemberName: string;
  streamKey?: string | null;
  streamTitle?: string | null;
  channelOwnerMemberId?: string | null;
  rail: GiftPaymentRail;
  cryptoAsset?: 'sui' | 'usdc' | 'goon' | null;
  auth?: {
    signature: string;
    timestampMs: number;
    signerAddress?: string;
  };
}): Promise<GiftIntentResponse> {
  const successUrl = window.location.origin + window.location.pathname + '?gift=success';
  const cancelUrl = window.location.origin + window.location.pathname + '?gift=cancel';

  return giftFetch<GiftIntentResponse>('/api/gifts/intents', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      successUrl,
      cancelUrl,
    }),
  });
}

export async function fulfillGoonWalletGift(input: {
  paymentId: string;
  txDigest: string;
  sender: string;
  auth?: {
    signature: string;
    timestampMs: number;
    signerAddress?: string;
  };
}): Promise<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment }> {
  return giftFetch<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment }>(
    '/api/gifts/intents/' + encodeURIComponent(input.paymentId) + '/fulfill',
    {
      method: 'POST',
      body: JSON.stringify({
        txDigest: input.txDigest,
        sender: input.sender,
        auth: input.auth,
      }),
    }
  );
}

export async function confirmMockGiftPayment(
  paymentId: string
): Promise<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment }> {
  return giftFetch<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment }>(
    '/api/gifts/intents/' + encodeURIComponent(paymentId) + '/mock/confirm',
    { method: 'POST', body: '{}' }
  );
}

export async function syncGiftCatalog(input: {
  owner: string;
  entries: Array<{
    id: string;
    label?: string;
    emoji?: string;
    goonAmount?: number;
    iconUrl?: string | null;
    enabled?: boolean;
  }>;
  auth?: {
    signature: string;
    timestampMs: number;
    signerAddress?: string;
  };
}): Promise<{ catalog: GiftCatalogEntry[]; updatedAtMs: number }> {
  return giftFetch<{ catalog: GiftCatalogEntry[]; updatedAtMs: number }>(
    '/api/gifts/catalog/sync',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

export async function fetchRecentGifts(input: {
  memberId?: string;
  streamKey?: string;
  limit?: number;
}): Promise<GiftFulfillment[]> {
  const params = new URLSearchParams();

  if (input.memberId) {
    params.set('memberId', input.memberId);
  }

  if (input.streamKey) {
    params.set('streamKey', input.streamKey);
  }

  if (input.limit) {
    params.set('limit', String(input.limit));
  }

  const query = params.toString();
  const payload = await giftFetch<{ gifts: GiftFulfillment[] }>(
    '/api/gifts/recent' + (query ? '?' + query : '')
  );

  return payload.gifts;
}
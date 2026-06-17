import type { NamiClient } from './client.js';
import type { NamiEventQueryOptions, NamiEventCursor } from './types.js';
import type { NamiModule } from './modules.js';

export interface NamiEventPage {
  module: NamiModule;
  data: Awaited<ReturnType<NamiClient['queryModuleEvents']>>['data'];
  nextCursor: NamiEventCursor | null;
  hasNextPage: boolean;
}

export interface NamiEventSubscriptionOptions extends NamiEventQueryOptions {
  /** Poll interval when using subscribeToNamiEvents. Default 12_000 ms. */
  pollIntervalMs?: number;
}

/**
 * Fetches one page of events for a Nami Move module.
 */
export async function fetchNamiModuleEvents(
  chain: NamiClient,
  module: NamiModule,
  options: NamiEventQueryOptions = {}
): Promise<NamiEventPage> {
  const response = await chain.queryModuleEvents(module, options);

  return {
    module,
    data: response.data,
    nextCursor: response.nextCursor ?? null,
    hasNextPage: response.hasNextPage,
  };
}

/**
 * Polls module events on an interval. Returns an unsubscribe function.
 * Suitable for dashboards until websocket subscriptions are available.
 */
export function subscribeToNamiEvents(
  chain: NamiClient,
  module: NamiModule,
  onEvents: (page: NamiEventPage) => void,
  options: NamiEventSubscriptionOptions = {}
): () => void {
  const pollIntervalMs = options.pollIntervalMs ?? 12_000;
  let cancelled = false;
  let cursor: NamiEventCursor | null = options.cursor ?? null;

  const poll = async (): Promise<void> => {
    if (cancelled) {
      return;
    }

    try {
      const page = await fetchNamiModuleEvents(chain, module, {
        ...options,
        cursor,
        order: options.order ?? 'descending',
        limit: options.limit ?? 25,
      });

      if (!cancelled) {
        onEvents(page);

        if (page.hasNextPage && page.nextCursor) {
          cursor = page.nextCursor;
        }
      }
    } catch {
      // Swallow poll errors; dashboards can show stale data.
    }
  };

  void poll();

  const intervalId = setInterval(() => {
    void poll();
  }, pollIntervalMs);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}
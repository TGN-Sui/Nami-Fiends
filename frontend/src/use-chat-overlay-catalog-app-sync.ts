import { useEffect } from 'react';

import { startChatOverlayCatalogAppSync } from './chat-overlay-catalog-sync.js';
import { startChatOverlayCatalogRetryLoop } from './chat-overlay-rewards-retry-queue.js';

/** Keep border art catalog fresh app-wide (polling, cross-tab, focus refresh, retry queue). */
export function useChatOverlayCatalogAppSync(): void {
  useEffect(() => {
    const stopCatalogSync = startChatOverlayCatalogAppSync();
    const stopRetryLoop = startChatOverlayCatalogRetryLoop();

    return () => {
      stopCatalogSync();
      stopRetryLoop();
    };
  }, []);
}
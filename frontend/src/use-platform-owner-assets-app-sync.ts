import { useEffect } from 'react';

import { startPlatformOwnerAssetsAppSync } from './platform-owner-assets-app-sync.js';

/** Keep logo and sidebar artwork fresh for testers (focus refresh + polling). */
export function usePlatformOwnerAssetsAppSync(): void {
  useEffect(() => {
    return startPlatformOwnerAssetsAppSync();
  }, []);
}
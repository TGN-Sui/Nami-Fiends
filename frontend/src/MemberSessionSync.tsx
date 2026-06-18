import { useEffect, type ReactElement } from 'react';

import {
  hydrateMemberSessionPreferences,
  setSessionPreferencesSyncOwner,
} from './preferences-sync.js';
import { useProtocolOwner } from './wallet.js';

export function MemberSessionSync(): ReactElement | null {
  const { owner } = useProtocolOwner();

  useEffect(() => {
    setSessionPreferencesSyncOwner(owner);

    if (!owner?.startsWith('0x')) {
      return;
    }

    void hydrateMemberSessionPreferences(owner);
  }, [owner]);

  return null;
}
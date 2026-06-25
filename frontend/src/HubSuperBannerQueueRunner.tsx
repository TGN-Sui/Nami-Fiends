import { useEffect, type ReactElement } from 'react';

import { playHubSuperBannerQueue } from './hub-super-banner-queue.js';
import { hasActiveMemberSession } from './member-session-store.js';

export function HubSuperBannerQueueRunner(props: {
  activePage: string;
  owner: string | null;
}): ReactElement | null {
  useEffect(() => {
    if (props.activePage !== 'hub') {
      return;
    }

    if (!props.owner?.startsWith('0x')) {
      return;
    }

    if (!hasActiveMemberSession()) {
      return;
    }

    void playHubSuperBannerQueue(props.owner);
  }, [props.activePage, props.owner]);

  return null;
}
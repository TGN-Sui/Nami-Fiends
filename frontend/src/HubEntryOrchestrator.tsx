import { useEffect, type ReactElement } from 'react';

import { playHubEntrySequence } from './hub-entry-orchestrator.js';
import { hasActiveMemberSession } from './member-session-store.js';

export function HubEntryOrchestrator(props: {
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

    void playHubEntrySequence(props.owner);
  }, [props.activePage, props.owner]);

  return null;
}
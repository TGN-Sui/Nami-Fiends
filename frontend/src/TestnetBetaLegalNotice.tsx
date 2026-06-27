import { useSyncExternalStore, useState, type ReactElement } from 'react';

import { isTestLaunchMode } from './app-config.js';
import { TESTNET_BETA_NOTICE } from './testnet-legal-content.js';
import {
  readTestnetBetaLegalDismissed,
  saveTestnetBetaLegalDismissed,
  subscribeTestnetBetaLegalDismissed,
} from './testnet-beta-legal-dismiss.js';
import { TestnetLegalPolicyOverlay } from './TestnetLegalPolicyOverlay.js';
import type { TestnetLegalPolicyId } from './testnet-legal-content.js';

export function TestnetBetaLegalNotice(): ReactElement | null {
  const [openPolicyId, setOpenPolicyId] = useState<TestnetLegalPolicyId | null>(null);
  const dismissed = useSyncExternalStore(
    subscribeTestnetBetaLegalDismissed,
    readTestnetBetaLegalDismissed,
    () => false,
  );

  if (!isTestLaunchMode() || dismissed) {
    return null;
  }

  function openPolicy(policyId: TestnetLegalPolicyId): void {
    setOpenPolicyId(policyId);
  }

  function dismissNotice(): void {
    setOpenPolicyId(null);
    saveTestnetBetaLegalDismissed();
  }

  return (
    <>
      <div className="testnet-beta-legal-notice" role="note">
        <div className="testnet-beta-legal-notice-head">
          <span className="mini-badge">Testnet beta</span>
          <button
            aria-label="Dismiss testnet beta notice"
            className="testnet-beta-legal-dismiss"
            onClick={dismissNotice}
            type="button"
          >
            Dismiss
          </button>
        </div>
        <p>{TESTNET_BETA_NOTICE}</p>
        <div className="testnet-beta-legal-links">
          <button
            className="testnet-beta-legal-link"
            onClick={() => openPolicy('privacy')}
            type="button"
          >
            Privacy draft
          </button>
          <button
            className="testnet-beta-legal-link"
            onClick={() => openPolicy('community')}
            type="button"
          >
            Community draft
          </button>
        </div>
      </div>

      {openPolicyId ? (
        <TestnetLegalPolicyOverlay onClose={() => setOpenPolicyId(null)} policyId={openPolicyId} />
      ) : null}
    </>
  );
}
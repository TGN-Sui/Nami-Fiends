import { useState, type ReactElement } from 'react';

import { isTestLaunchMode } from './app-config.js';
import { TESTNET_BETA_NOTICE } from './testnet-legal-content.js';
import { TestnetLegalPolicyOverlay } from './TestnetLegalPolicyOverlay.js';
import type { TestnetLegalPolicyId } from './testnet-legal-content.js';

export function TestnetBetaLegalNotice(): ReactElement | null {
  const [openPolicyId, setOpenPolicyId] = useState<TestnetLegalPolicyId | null>(null);

  if (!isTestLaunchMode()) {
    return null;
  }

  function openPolicy(policyId: TestnetLegalPolicyId): void {
    setOpenPolicyId(policyId);
  }

  return (
    <>
      <div className="testnet-beta-legal-notice" role="note">
        <span className="mini-badge">Testnet beta</span>
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
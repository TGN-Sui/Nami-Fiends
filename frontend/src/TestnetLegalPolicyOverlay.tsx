import { useEffect, type ReactElement } from 'react';

import {
  resolveTestnetLegalPolicy,
  type TestnetLegalPolicyId,
} from './testnet-legal-content.js';

export function TestnetLegalPolicyOverlay(props: {
  policyId: TestnetLegalPolicyId;
  onClose: () => void;
}): ReactElement {
  const policy = resolveTestnetLegalPolicy(props.policyId);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        props.onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [props]);

  return (
    <div
      className="testnet-legal-overlay-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
      role="presentation"
    >
      <article
        aria-labelledby="testnet-legal-overlay-title"
        className="testnet-legal-overlay panel"
        role="dialog"
      >
        <header className="testnet-legal-overlay-head">
          <div>
            <span className="mini-badge">Testnet draft</span>
            <h2 id="testnet-legal-overlay-title">{policy.title}</h2>
            <p>{policy.subtitle}</p>
          </div>
          <button
            aria-label="Close policy"
            className="testnet-legal-overlay-close"
            onClick={props.onClose}
            type="button"
          >
            Close
          </button>
        </header>

        <div className="testnet-legal-overlay-body">
          {policy.sections.map((section) => (
            <section className="testnet-legal-overlay-section" key={section.heading}>
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
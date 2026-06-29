import { useMemo, type ReactElement } from 'react';

import { assessPortalZkLoginCutover } from './portal-zklogin-cutover.js';

export function PortalZkLoginCutoverCard(): ReactElement {
  const snapshot = useMemo(() => assessPortalZkLoginCutover(), []);

  return (
    <section className="launch-ops-card">
      <h3>Walrus portal + zkLogin (Phase 9.1.4)</h3>
      <ul className="protocol-timeline-list">
        <li className="protocol-timeline-item">
          Current origin <strong>{snapshot.pageOrigin ?? 'server render'}</strong>
        </li>
        <li className="protocol-timeline-item">
          Build redirect <strong>{snapshot.configuredRedirectUrl}</strong>
        </li>
        <li className="protocol-timeline-item">
          Redirect aligned <strong>{snapshot.redirectAligned ? 'yes' : 'no'}</strong>
        </li>
        <li className="protocol-timeline-item">
          Walrus portal env{' '}
          <strong>{snapshot.walrusPortalUrl ?? 'unset (VITE_NAMI_WALRUS_PORTAL_URL)'}</strong>
        </li>
        <li className="protocol-timeline-item">
          zkLogin client <strong>{snapshot.zkLoginConfigured ? 'configured' : 'missing'}</strong>
        </li>
      </ul>

      {snapshot.issues.length > 0 ? (
        <ul className="protocol-timeline-list launch-ops-pending-actions">
          {snapshot.issues.map((issue) => (
            <li className="protocol-timeline-item protocol-hint" key={issue.code}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="protocol-hint">zkLogin redirect matches this page origin.</p>
      )}

      <ol className="protocol-timeline-list launch-ops-cutover-steps">
        {snapshot.cutoverSteps.map((step) => (
          <li className="protocol-timeline-item protocol-hint" key={step}>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
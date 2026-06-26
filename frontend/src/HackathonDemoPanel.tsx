import { useEffect, useState, type ReactElement } from 'react';

import { isIndexerLive, readAppConfig } from './app-config.js';
import {
  buildHackathonReadinessChecks,
  HACKATHON_DEMO_STEPS,
  hackathonDemoReadyScore,
  type HackathonDemoStep,
  type HackathonReadinessCheck,
} from './hackathon-demo-readiness.js';
import { fetchLaunchOpsSummary, type LaunchOpsSummary } from './launch-ops-api.js';
import type { SettingsNavId } from './settings-navigation.js';
import type { NamiPage } from './uiMockData.js';

function statusLabel(status: HackathonReadinessCheck['status']): string {
  if (status === 'ready') {
    return 'Ready';
  }

  if (status === 'warn') {
    return 'Optional';
  }

  return 'Blocked';
}

function navigateDemoStep(
  step: HackathonDemoStep,
  props: {
    onNavigate?: ((page: NamiPage) => void) | undefined;
    onOpenSettingsNav?: ((navId: SettingsNavId) => void) | undefined;
  }
): void {
  const target = step.navTarget;

  if (!target) {
    return;
  }

  if (target === 'hub') {
    props.onNavigate?.('hub');
    return;
  }

  props.onOpenSettingsNav?.(target);
}

export function HackathonDemoPanel(props: {
  embedded?: boolean;
  onNavigate?: ((page: NamiPage) => void) | undefined;
  onOpenSettingsNav?: ((navId: SettingsNavId) => void) | undefined;
}): ReactElement {
  const [summary, setSummary] = useState<LaunchOpsSummary | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const indexerLive = isIndexerLive(readAppConfig());

  useEffect(() => {
    if (!indexerLive) {
      setLoadState('ready');
      setSummary(null);
      return;
    }

    let cancelled = false;

    setLoadState('loading');
    setErrorMessage(null);

    void fetchLaunchOpsSummary()
      .then((nextSummary) => {
        if (cancelled) {
          return;
        }

        setSummary(nextSummary);
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setSummary(null);
        setLoadState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Could not load launch summary.');
      });

    return () => {
      cancelled = true;
    };
  }, [indexerLive]);

  const checks = buildHackathonReadinessChecks(summary);
  const score = hackathonDemoReadyScore(checks);
  const demoReady = score.blocked === 0;

  return (
    <article
      className={
        'panel hackathon-demo-panel' +
        (props.embedded ? ' nami-owner-advanced-embedded-panel' : ' settings-section-wide')
      }
    >
      {props.embedded ? null : (
        <div className="profile-panel-heading">
          <h2>Hackathon demo</h2>
          <p>Judge-facing walkthrough, readiness checks, and shortcuts into the live MVP.</p>
        </div>
      )}

      <div className="hackathon-demo-hero">
        <span className="mini-badge">Sui x Walrus MVP</span>
        <p>
          Nami is a gaming identity and social protocol on Sui. This console keeps the submitted
          Move package frozen while Walrus stores border-art bytes and the receiving server projects
          catalog JSON.
        </p>
        <div className="hackathon-demo-score-row" aria-label="Demo readiness score">
          <span className="hackathon-demo-score is-ready">{score.ready} ready</span>
          <span className="hackathon-demo-score is-warn">{score.warn} optional</span>
          <span className="hackathon-demo-score is-blocked">{score.blocked} blocked</span>
        </div>
        <p className="protocol-hint">
          {demoReady
            ? 'Core demo path is clear — follow the steps below for judges.'
            : 'Resolve blocked checks before a live walkthrough.'}
        </p>
      </div>

      {!indexerLive ? (
        <p className="protocol-hint">
          Set `VITE_NAMI_INDEXER_URL` to load live readiness from the receiving server.
        </p>
      ) : null}
      {loadState === 'loading' ? <p className="protocol-hint">Loading launch summary…</p> : null}
      {loadState === 'error' ? <p className="protocol-hint">{errorMessage}</p> : null}

      <section className="hackathon-demo-section">
        <h3>Readiness checks</h3>
        <ul className="hackathon-demo-check-list">
          {checks.map((check) => (
            <li className={'hackathon-demo-check is-' + check.status} key={check.id}>
              <div className="hackathon-demo-check-head">
                <strong>{check.label}</strong>
                <span className="hackathon-demo-check-status">{statusLabel(check.status)}</span>
              </div>
              <p>{check.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="hackathon-demo-section">
        <h3>Demo steps (6–8 min)</h3>
        <ol className="hackathon-demo-step-list">
          {HACKATHON_DEMO_STEPS.map((step, index) => (
            <li className="hackathon-demo-step" key={step.id}>
              <div className="hackathon-demo-step-copy">
                <span className="hackathon-demo-step-index">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </div>
              </div>
              {step.navTarget ? (
                <button
                  className="profile-secondary-link hackathon-demo-step-action"
                  onClick={() => navigateDemoStep(step, props)}
                  type="button"
                >
                  Go
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="hackathon-demo-section hackathon-demo-ops-note">
        <h3>Ops without zkLogin</h3>
        <p className="protocol-hint">
          Owner quilt publish still needs a signable zkLogin session in the browser. For judges and
          CI, run local Walrus smoke instead:
        </p>
        <code className="hackathon-demo-command">
          npx --prefix backend tsx scripts/smoke-border-art-walrus-local.mjs
        </code>
        <p className="protocol-hint">
          Full pre-demo gate: <code>node scripts/hackathon-demo-ready.mjs</code>
        </p>
      </section>
    </article>
  );
}
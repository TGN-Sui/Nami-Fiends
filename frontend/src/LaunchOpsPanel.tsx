import { useEffect, useState, type ReactElement } from 'react';

import { isIndexerLive, readAppConfig } from './app-config.js';
import { fetchLaunchOpsSummary, type LaunchOpsSummary } from './launch-ops-api.js';
import { PortalZkLoginCutoverCard } from './PortalZkLoginCutoverCard.js';

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString();
}

export function LaunchOpsPanel(props: { embedded?: boolean } = {}): ReactElement {
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

  return (
    <article
      className={
        'panel settings-launch-ops-panel' +
        (props.embedded ? ' nami-owner-advanced-embedded-panel' : ' settings-section-wide')
      }
    >
      {props.embedded ? null : (
        <div className="profile-panel-heading">
          <h2>Launch Ops</h2>
          <p>Testnet readiness, officials queue depth, and discovery cycle health.</p>
        </div>
      )}

      {!indexerLive ? (
        <p className="protocol-hint">Set `VITE_NAMI_INDEXER_URL` to load launch ops from the receiving server.</p>
      ) : null}

      {loadState === 'loading' ? <p className="protocol-hint">Loading launch summary…</p> : null}
      {loadState === 'error' ? <p className="protocol-hint">{errorMessage}</p> : null}

      {summary ? (
        <div className="launch-ops-summary-grid">
          <section className="launch-ops-card">
            <h3>Test launch policy</h3>
            <ul className="protocol-timeline-list">
              <li className="protocol-timeline-item">
                Network <strong>{summary.network}</strong>
              </li>
              <li className="protocol-timeline-item">
                Test launch <strong>{summary.test_launch ? 'enabled' : 'disabled'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Mock payments <strong>{summary.payment_allow_mock ? 'allowed' : 'blocked'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Official owner <strong>{summary.official_owner_configured ? 'configured' : 'missing'}</strong>
              </li>
            </ul>
          </section>

          {summary.security_review ? (
            <section className="launch-ops-card">
              <h3>Security &amp; Custody (Phase 8.4)</h3>
              <ul className="protocol-timeline-list">
                <li className="protocol-timeline-item">
                  Backup holder{' '}
                  <strong>
                    {summary.security_review.backup_holder_configured ? 'assigned' : 'missing'}
                  </strong>
                </li>
                <li className="protocol-timeline-item">
                  Mock payments{' '}
                  <strong>
                    {summary.security_review.mock_payments_disabled ? 'disabled' : 'allowed'}
                  </strong>
                </li>
                <li className="protocol-timeline-item">
                  Seal evidence key{' '}
                  <strong>
                    {summary.security_review.seal_key_configured ? 'configured' : 'missing'}
                  </strong>
                </li>
                <li className="protocol-timeline-item">
                  Officials sync secret{' '}
                  <strong>
                    {summary.security_review.officials_sync_secret_server_only
                      ? 'server-only'
                      : 'check frontend env'}
                  </strong>
                </li>
                <li className="protocol-timeline-item">
                  Security script{' '}
                  <strong>
                    {summary.security_review.security_script_last_run_ms
                      ? formatTimestamp(summary.security_review.security_script_last_run_ms)
                      : 'not recorded'}
                  </strong>
                </li>
                <li className="protocol-timeline-item">
                  Review gate{' '}
                  <strong>{summary.security_review.review_ready ? 'ready' : 'blocked'}</strong>
                </li>
              </ul>
              <p className="protocol-hint">
                Run <code>node scripts/verify-security-review.mjs</code> before public URL. See{' '}
                <code>docs/security-audit.md</code>.
              </p>
            </section>
          ) : null}

          <section className="launch-ops-card">
            <h3>Phase 8 exit gates</h3>
            <ul className="protocol-timeline-list">
              <li className="protocol-timeline-item">
                Core test-launch policy{' '}
                <strong>{summary.exit_gates.core_policy_ready ? 'ready' : 'blocked'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Card checkout (Stripe){' '}
                <strong>
                  {!summary.payment_readiness.card_checkout_enabled
                    ? 'disabled'
                    : summary.exit_gates.card_checkout_ready
                      ? 'ready'
                      : 'blocked'}
                </strong>
              </li>
              <li className="protocol-timeline-item">
                Crypto checkout (treasury){' '}
                <strong>{summary.exit_gates.crypto_checkout_ready ? 'ready' : 'blocked'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Phase 8 launch (card + policy){' '}
                <strong>{summary.exit_gates.phase_8_launch_ready ? 'ready' : 'in progress'}</strong>
              </li>
            </ul>
            {summary.pending_actions.length > 0 ? (
              <ul className="protocol-timeline-list launch-ops-pending-actions">
                {summary.pending_actions.map((action) => (
                  <li key={action} className="protocol-timeline-item protocol-hint">
                    {action}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {summary.seal_privacy ? (
            <section className="launch-ops-card">
              <h3>Seal privacy (Phase 9.2)</h3>
              <ul className="protocol-timeline-list">
                <li className="protocol-timeline-item">
                  Lane enabled <strong>{summary.seal_privacy.enabled ? 'yes' : 'no'}</strong>
                </li>
                <li className="protocol-timeline-item">
                  Evidence key <strong>{summary.seal_privacy.key_configured ? 'configured' : 'missing'}</strong>
                </li>
                <li className="protocol-timeline-item">
                  Sealed packets <strong>{summary.seal_privacy.sealed_count}</strong>
                </li>
                <li className="protocol-timeline-item">
                  Policies in use <strong>{summary.seal_privacy.policies_in_use.length}</strong>
                </li>
                {summary.seal_privacy.migration_stage ? (
                  <li className="protocol-timeline-item">
                    Migration stage <strong>{summary.seal_privacy.migration_stage}</strong>
                  </li>
                ) : null}
                <li className="protocol-timeline-item">
                  Walrus ciphertext blobs{' '}
                  <strong>{summary.seal_privacy.walrus_ciphertext_count ?? 0}</strong>
                </li>
              </ul>
              <p className="protocol-hint">{summary.seal_privacy.stack_note}</p>
            </section>
          ) : null}

          <PortalZkLoginCutoverCard />

          {summary.walrus_sites ? (
            <section className="launch-ops-card">
              <h3>Walrus Sites (SPA)</h3>
              <ul className="protocol-timeline-list">
                <li className="protocol-timeline-item">
                  Site deployed <strong>{summary.walrus_sites.configured ? 'yes' : 'no'}</strong>
                </li>
                <li className="protocol-timeline-item">
                  ws-resources.json{' '}
                  <strong>{summary.walrus_sites.ws_resources_present ? 'present' : 'missing'}</strong>
                </li>
                <li className="protocol-timeline-item">
                  Site object{' '}
                  <strong>
                    {summary.walrus_sites.site_object_id
                      ? summary.walrus_sites.site_object_id.slice(0, 12) + '…'
                      : 'none'}
                  </strong>
                </li>
                <li className="protocol-timeline-item">
                  Network <strong>{summary.walrus_sites.network ?? 'unset'}</strong>
                </li>
                <li className="protocol-timeline-item">
                  Storage epochs <strong>{summary.walrus_sites.storage_epochs ?? '—'}</strong>
                </li>
                <li className="protocol-timeline-item">
                  Last deploy{' '}
                  <strong>
                    {summary.walrus_sites.last_deploy_ms
                      ? new Date(summary.walrus_sites.last_deploy_ms).toLocaleString()
                      : 'never'}
                  </strong>
                </li>
                <li className="protocol-timeline-item">
                  Last renew{' '}
                  <strong>
                    {summary.walrus_sites.last_renew_ms
                      ? new Date(summary.walrus_sites.last_renew_ms).toLocaleString()
                      : 'never'}
                  </strong>
                </li>
                <li className="protocol-timeline-item">
                  Renewal status{' '}
                  <strong>
                    {summary.walrus_sites.renewal_due
                      ? 'due — run renew-walrus-sites.mjs'
                      : summary.walrus_sites.epochs_remaining_approx !== null
                        ? '~' + summary.walrus_sites.epochs_remaining_approx + ' epoch(s) left'
                        : 'unknown'}
                  </strong>
                </li>
                {summary.walrus_sites.expires_at_ms ? (
                  <li className="protocol-timeline-item">
                    Expires approx{' '}
                    <strong>{new Date(summary.walrus_sites.expires_at_ms).toLocaleString()}</strong>
                  </li>
                ) : null}
              </ul>
              <p className="protocol-hint">{summary.walrus_sites.portal_note}</p>
            </section>
          ) : null}

          <section className="launch-ops-card">
            <h3>Walrus border art</h3>
            <ul className="protocol-timeline-list">
              <li className="protocol-timeline-item">
                Quilt publisher{' '}
                <strong>{summary.walrus_border_art.configured ? 'configured' : 'missing'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Network <strong>{summary.walrus_border_art.network ?? 'unset'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Storage epochs <strong>{summary.walrus_border_art.storage_epochs}</strong>
              </li>
              <li className="protocol-timeline-item">
                Render fallback blocked{' '}
                <strong>{summary.walrus_border_art.border_art_required ? 'yes' : 'no'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Catalog quilt blob{' '}
                <strong>
                  {summary.walrus_border_art.catalog_quilt_blob_id
                    ? summary.walrus_border_art.catalog_quilt_blob_id.slice(0, 12) + '…'
                    : 'none'}
                </strong>
              </li>
              <li className="protocol-timeline-item">
                Catalog patches <strong>{summary.walrus_border_art.catalog_patch_count}</strong>
              </li>
              <li className="protocol-timeline-item">
                Last publish{' '}
                <strong>
                  {summary.walrus_border_art.catalog_last_publish_ms
                    ? new Date(summary.walrus_border_art.catalog_last_publish_ms).toLocaleString()
                    : 'never'}
                </strong>
              </li>
              <li className="protocol-timeline-item">
                On-chain attestation{' '}
                <strong>{summary.walrus_border_art.catalog_attestation_status ?? 'none'}</strong>
              </li>
              {summary.walrus_border_art.catalog_attestation_tx_digest ? (
                <li className="protocol-timeline-item">
                  Attest tx{' '}
                  <strong>
                    {summary.walrus_border_art.catalog_attestation_tx_digest.slice(0, 12)}…
                  </strong>
                </li>
              ) : null}
            </ul>
          </section>

          <section className="launch-ops-card">
            <h3>Payment readiness</h3>
            <ul className="protocol-timeline-list">
              <li className="protocol-timeline-item">
                Treasury wallet{' '}
                <strong>{summary.payment_readiness.treasury_configured ? 'configured' : 'missing'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Stripe keys <strong>{summary.payment_readiness.stripe_configured ? 'configured' : 'missing'}</strong>
              </li>
              <li className="protocol-timeline-item">
                PayPal keys <strong>{summary.payment_readiness.paypal_configured ? 'configured' : 'missing'}</strong>
              </li>
              <li className="protocol-timeline-item">
                Checkout rails{' '}
                <strong>
                  crypto {summary.payment_readiness.crypto_checkout_enabled ? 'on' : 'off'} / card{' '}
                  {summary.payment_readiness.card_checkout_enabled ? 'on' : 'off'} / PayPal{' '}
                  {summary.payment_readiness.paypal_checkout_enabled ? 'on' : 'off'}
                </strong>
              </li>
            </ul>
          </section>

          <section className="launch-ops-card">
            <h3>Officials queue</h3>
            <ul className="protocol-timeline-list">
              <li className="protocol-timeline-item">
                Pending total <strong>{summary.officials_pending.total}</strong>
              </li>
              <li className="protocol-timeline-item">
                Suggestions <strong>{summary.officials_pending.suggestions}</strong>
              </li>
              <li className="protocol-timeline-item">
                Game tickets <strong>{summary.officials_pending.game_tickets}</strong>
              </li>
              <li className="protocol-timeline-item">
                Partner banners <strong>{summary.officials_pending.partner_banners}</strong>
              </li>
              <li className="protocol-timeline-item">
                Nodename claims <strong>{summary.officials_pending.nodename_claims}</strong>
              </li>
            </ul>
          </section>

          <section className="launch-ops-card">
            <h3>Indexer projections</h3>
            <ul className="protocol-timeline-list">
              <li className="protocol-timeline-item">
                Public channels <strong>{summary.projections.channels_public}</strong> (
                {summary.projections.channels_verified} verified)
              </li>
              <li className="protocol-timeline-item">
                Public guilds <strong>{summary.projections.guilds_public}</strong>
              </li>
              <li className="protocol-timeline-item">
                Active moderation <strong>{summary.projections.moderation_active}</strong>
              </li>
              <li className="protocol-timeline-item">
                Boost events <strong>{summary.projections.boost_events}</strong>
              </li>
              <li className="protocol-timeline-item">
                Open appeals / recovery / jury{' '}
                <strong>
                  {summary.projections.appeals_open} / {summary.projections.recovery_open} /{' '}
                  {summary.projections.jury_open}
                </strong>
              </li>
            </ul>
          </section>

          <section className="launch-ops-card">
            <h3>Discovery cycle</h3>
            <ul className="protocol-timeline-list">
              <li className="protocol-timeline-item">
                Engine <strong>{summary.discovery.engine_version}</strong>
              </li>
              <li className="protocol-timeline-item">
                Week <strong>{summary.discovery.week_id}</strong>
              </li>
              <li className="protocol-timeline-item">
                Featured channels ranked <strong>{summary.discovery.featured_channels}</strong>
              </li>
              <li className="protocol-timeline-item">
                Categories <strong>{summary.discovery.category_count}</strong>
              </li>
            </ul>
            <p className="protocol-hint">Updated {formatTimestamp(summary.generated_at_ms)}.</p>
          </section>
        </div>
      ) : null}

    </article>
  );
}
import { useEffect, useState, type ReactElement } from 'react';

import {
  BOOST_RESET_TIME_ZONE,
  formatBoostCycleCountdown,
  formatBoostCycleResetCentral,
  formatBoostCycleResetLocal,
  getBoostCycleResetTimeZone,
} from './boost-cycle.js';
import { boostCycleLimit, getRemainingBoosts } from './channel-boost-store.js';
import { getSelfMember } from './member-access.js';
import { effectiveMemberTier } from './membership-plans-store.js';

export function BoostCycleSettingsCard(): ReactElement {
  const selfMember = getSelfMember();
  const tier = effectiveMemberTier();
  const cycleLimit = boostCycleLimit(tier);
  const remainingBoosts = getRemainingBoosts(selfMember);
  const localZone = getBoostCycleResetTimeZone();
  const [countdown, setCountdown] = useState(() => formatBoostCycleCountdown());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(formatBoostCycleCountdown());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <article className="panel settings-card settings-compact-card boost-cycle-settings-card">
      <div className="profile-panel-heading">
        <h2>Weekly boost reset</h2>
        <p>
          Boosts return to your membership tier every Friday at 12:00 PM Central Time (
          {BOOST_RESET_TIME_ZONE}). Unused boosts do not roll over.
        </p>
      </div>

      <dl className="boost-cycle-settings-grid">
        <div>
          <dt>Your timezone</dt>
          <dd>{localZone}</dd>
        </div>
        <div>
          <dt>Your next reset</dt>
          <dd>{formatBoostCycleResetLocal()}</dd>
        </div>
        <div>
          <dt>Central anchor</dt>
          <dd>{formatBoostCycleResetCentral()}</dd>
        </div>
        <div>
          <dt>Resets in</dt>
          <dd>{countdown}</dd>
        </div>
        {cycleLimit > 0 ? (
          <div>
            <dt>Boosts left this cycle</dt>
            <dd>
              {remainingBoosts} of {cycleLimit}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
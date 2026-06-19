import type { ReactElement } from 'react';

import {
  boostCycleLimit,
  getRemainingBoosts,
  useChannelBoostStore,
} from './channel-boost-store.js';
import { getSelfMember } from './member-access.js';

import {
  availableSquadInviteSlots,
  squadSlotsForLeader,
  useSquadRosterStore,
} from './squad-roster-store.js';

export function PinnedProfileCapacityStrip(): ReactElement | null {
  useChannelBoostStore();
  useSquadRosterStore();

  const selfMember = getSelfMember();
  const boostLimit = boostCycleLimit(selfMember.tier);
  const remainingBoosts = getRemainingBoosts(selfMember);
  const squadLimit = squadSlotsForLeader(selfMember.id);
  const remainingSquadSlots = availableSquadInviteSlots(selfMember.id);

  if (boostLimit === 0 && squadLimit === 0) {
    return null;
  }

  return (
    <div aria-label="Membership capacity" className="sidebar-profile-capacity-strip">
      {boostLimit > 0 ? (
        <span className="sidebar-profile-capacity-line">
          {remainingBoosts} of {boostLimit} boost{boostLimit === 1 ? '' : 's'} left
        </span>
      ) : null}
      {squadLimit > 0 ? (
        <span className="sidebar-profile-capacity-line">
          {remainingSquadSlots} of {squadLimit} squad slot{squadLimit === 1 ? '' : 's'} left
        </span>
      ) : null}
    </div>
  );
}
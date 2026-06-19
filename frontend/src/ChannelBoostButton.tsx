import type { ReactElement } from 'react';

import {
  getChannelBoostEligibility,
  getMemberChannelBoostCount,
  getRemainingBoosts,
  MAX_BOOSTS_PER_CHANNEL_PER_CYCLE,
  type ChannelBoostEligibility,
} from './channel-boost-store.js';
import type { NamiMember } from './uiMockData.js';

function boostButtonLabel(
  eligibility: ChannelBoostEligibility,
  channelBoostCount: number,
  remainingBoosts: number,
): string {
  if (eligibility === 'eligible') {
    if (channelBoostCount > 0) {
      return 'Boost again (' + channelBoostCount + '/' + MAX_BOOSTS_PER_CHANNEL_PER_CYCLE + ')';
    }

    return 'Boost channel';
  }

  if (eligibility === 'maxed-channel') {
    return 'Boosted (' + MAX_BOOSTS_PER_CHANNEL_PER_CYCLE + '/' + MAX_BOOSTS_PER_CHANNEL_PER_CYCLE + ')';
  }

  if (eligibility === 'cycle-limit') {
    return 'No boosts left';
  }

  if (eligibility === 'npc-tier' || eligibility === 'not-verified') {
    return 'Verify to boost';
  }

  if (eligibility === 'black-signal') {
    return 'Boosts unavailable';
  }

  return 'Boost channel (' + remainingBoosts + ' left)';
}

function boostButtonTitle(
  eligibility: ChannelBoostEligibility,
  channelBoostCount: number,
  remainingBoosts: number,
  channelBoostPower: number,
): string {
  const cycleSummary =
    channelBoostPower > 0
      ? channelBoostPower + ' boost power this discovery cycle.'
      : 'No boost power recorded for this channel yet this cycle.';

  if (eligibility === 'eligible') {
    return (
      'Apply one of your weekly boosts to help this game channel surface in discovery. ' +
      remainingBoosts +
      ' boost' +
      (remainingBoosts === 1 ? '' : 's') +
      ' remaining this cycle. ' +
      (channelBoostCount > 0
        ? 'You have boosted this channel ' + channelBoostCount + ' time' + (channelBoostCount === 1 ? '' : 's') + ' already. '
        : '') +
      cycleSummary
    );
  }

  if (eligibility === 'maxed-channel') {
    return (
      'You reached the per-channel limit of ' +
      MAX_BOOSTS_PER_CHANNEL_PER_CYCLE +
      ' boosts for this discovery cycle. ' +
      cycleSummary
    );
  }

  if (eligibility === 'cycle-limit') {
    return 'All weekly boosts are used. Boosts reset at the start of the next discovery cycle.';
  }

  if (eligibility === 'npc-tier') {
    return 'Adventurer, Pro, and Elite members can boost channels. Verify or upgrade membership to participate.';
  }

  if (eligibility === 'not-verified') {
    return 'Verified members can boost channels during weekly discovery cycles.';
  }

  if (eligibility === 'black-signal') {
    return 'Conduct restrictions disable boost access until the Black Passport status clears.';
  }

  return cycleSummary;
}

export function ChannelBoostButton(props: {
  channelId: string;
  channelBoostPower: number;
  member: NamiMember;
  onBoost: () => void;
}): ReactElement {
  const eligibility = getChannelBoostEligibility(props.member, props.channelId);
  const channelBoostCount = getMemberChannelBoostCount(props.member.id, props.channelId);
  const remainingBoosts = getRemainingBoosts(props.member);
  const isDisabled = eligibility !== 'eligible';
  const isActive = channelBoostCount > 0;

  return (
    <button
      className={
        'secondary-action channel-boost-action' +
        (isActive ? ' is-channel-boost-active' : '') +
        (isDisabled ? ' is-channel-boost-unavailable' : '')
      }
      disabled={isDisabled}
      onClick={props.onBoost}
      title={boostButtonTitle(eligibility, channelBoostCount, remainingBoosts, props.channelBoostPower)}
      type="button"
    >
      {boostButtonLabel(eligibility, channelBoostCount, remainingBoosts)}
    </button>
  );
}
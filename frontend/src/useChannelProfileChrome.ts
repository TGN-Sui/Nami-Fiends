import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  isChannelBannerAlertsEnabled,
  scheduleWelcomeBannerNotification,
  simulateChannelBannerBurst,
  subscribeToChannelBannerAlerts,
  unsubscribeFromChannelBannerAlerts,
  useChannelBannerNotificationsStore,
} from './channel-banner-notifications-store.js';
import { applyChannelBrandToDocument, channelBrandThemes, getStoredChannelBrandTheme } from './channel-profile-brand.js';
import {
  boostChannel,
  getChannelBoostPower,
  getMemberChannelBoostCount,
  getRemainingBoosts,
  useChannelBoostStore,
} from './channel-boost-store.js';
import { isGameChannelOwner, ownsGameChannel } from './channel-owner-access.js';
import { canSubscribeToChannelBanners, getSelfMember } from './member-access.js';
import {
  isChannelSubscribed,
  subscribeToChannel,
  subscriptionSlotLimit,
} from './subscriptions-store.js';
import { developers, type NamiChannel } from './uiMockData.js';

function channelDeveloper(channel: NamiChannel): (typeof developers)[number] {
  return developers.find((developer) => developer.id === channel.developerId) ?? developers[0]!;
}

export function useChannelProfileChrome(channel: NamiChannel) {
  useChannelBannerNotificationsStore();
  useChannelBoostStore();

  const developerProfile = channelDeveloper(channel);
  const selfMember = getSelfMember();
  const channelIsSubscribed = isChannelSubscribed(channel.id);
  const bannerAlertsEnabled = isChannelBannerAlertsEnabled(channel.id);
  const isChannelOwner = isGameChannelOwner() && ownsGameChannel(channel.id);
  const isEliteChannelOwner = isChannelOwner && selfMember.tier === 'Elite';
  const showMemberConsumerActions = !isGameChannelOwner();

  const selectedBrandTheme = useMemo(() => getStoredChannelBrandTheme(channel.id), [channel.id]);

  const profileBrandStyle = {
    '--profile-brand-primary': selectedBrandTheme.primary,
    '--profile-brand-secondary': selectedBrandTheme.secondary,
    '--profile-brand-glow': selectedBrandTheme.glow,
  } as CSSProperties;

  const [subscribeNotice, setSubscribeNotice] = useState('');
  const [bannerNotice, setBannerNotice] = useState('');
  const [boostNotice, setBoostNotice] = useState('');

  const channelBoostPower = getChannelBoostPower(channel.id);
  const memberChannelBoostCount = getMemberChannelBoostCount(selfMember.id, channel.id);
  const remainingBoosts = getRemainingBoosts(selfMember);

  useEffect(() => {
    applyChannelBrandToDocument(selectedBrandTheme);
  }, [selectedBrandTheme, channel.id]);

  function handleSubscribe(): void {
    if (channelIsSubscribed) {
      setSubscribeNotice('Already subscribed to ' + channel.name + '.');
      return;
    }

    const result = subscribeToChannel(channel.id, selfMember.tier);

    if (!result.ok) {
      if (result.reason === 'slots-full') {
        setSubscribeNotice(
          'Subscription slots full (' +
            subscriptionSlotLimit(selfMember.tier) +
            ' max for ' +
            selfMember.tier +
            ' tier).',
        );
      } else {
        setSubscribeNotice('Already subscribed to this channel.');
      }

      return;
    }

    setSubscribeNotice('Subscribed to ' + channel.name + '. Find it in My Profile → My Subscriptions.');
  }

  function handleBannerAlertsToggle(): void {
    if (!canSubscribeToChannelBanners(selfMember)) {
      setBannerNotice('Claim and verify your passport to receive banner alerts.');
      return;
    }

    if (bannerAlertsEnabled) {
      unsubscribeFromChannelBannerAlerts(channel.id);
      setBannerNotice('Banner alerts turned off for ' + channel.name + '.');
      return;
    }

    const result = subscribeToChannelBannerAlerts(channel.id);

    if (!result.ok) {
      setBannerNotice(
        result.reason === 'not-verified'
          ? 'Claim and verify your passport to receive banner alerts.'
          : 'Could not enable banner alerts for this channel.'
      );
      return;
    }

    if (result.alreadyEnabled) {
      setBannerNotice('Banner alerts are already enabled for ' + channel.name + '.');
      return;
    }

    setBannerNotice('Banner alerts enabled for ' + channel.name + '.');
    scheduleWelcomeBannerNotification(channel.id);
  }

  function handleBoostChannel(): void {
    const result = boostChannel(channel.id, selfMember);

    if (!result.ok) {
      if (result.reason === 'black-signal') {
        setBoostNotice('Boost access is disabled while Black Passport conduct restrictions are active.');
        return;
      }

      if (result.reason === 'npc-tier') {
        setBoostNotice('Upgrade to Adventurer or higher to boost game channels during weekly discovery cycles.');
        return;
      }

      if (result.reason === 'not-verified') {
        setBoostNotice('Verify your membership before boosting channels.');
        return;
      }

      if (result.reason === 'cycle-limit') {
        setBoostNotice('No boosts left this discovery cycle. Boosts reset next week.');
        return;
      }

      if (result.reason === 'channel-limit') {
        setBoostNotice(
          'You already boosted ' +
            channel.name +
            ' the maximum number of times for this discovery cycle.',
        );
        return;
      }

      setBoostNotice('Could not apply a boost for this channel.');
      return;
    }

    setBoostNotice(
      'Boosted ' +
        channel.name +
        ' with +' +
        result.entry.power +
        ' discovery power. ' +
        result.remainingBoosts +
        ' boost' +
        (result.remainingBoosts === 1 ? '' : 's') +
        ' left this cycle.',
    );
  }

  function handleSimulateSubscribedBurst(): void {
    const created = simulateChannelBannerBurst();

    setBannerNotice(
      created.length > 0
        ? 'Simulated ' + created.length + ' banner alert' + (created.length === 1 ? '' : 's') + ' in the queue.'
        : 'Enable Get Banners on one or more channels to simulate the queue.',
    );
  }

  return {
    developerProfile,
    selfMember,
    channelIsSubscribed,
    bannerAlertsEnabled,
    isChannelOwner,
    isEliteChannelOwner,
    showMemberConsumerActions,
    profileBrandStyle,
    selectedBrandTheme,
    brandThemes: channelBrandThemes,
    subscribeNotice,
    bannerNotice,
    boostNotice,
    channelBoostPower,
    memberChannelBoostCount,
    remainingBoosts,
    handleSubscribe,
    handleBannerAlertsToggle,
    handleBoostChannel,
    handleSimulateSubscribedBurst,
  };
}
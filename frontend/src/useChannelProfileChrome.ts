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
import { getSelfMember } from './member-access.js';
import { readViewingAsChannelOwner } from './surface-preferences.js';
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

  const developerProfile = channelDeveloper(channel);
  const selfMember = getSelfMember();
  const channelIsSubscribed = isChannelSubscribed(channel.id);
  const bannerAlertsEnabled = isChannelBannerAlertsEnabled(channel.id);
  const isChannelOwner = readViewingAsChannelOwner();
  const isEliteChannelOwner = isChannelOwner && selfMember.tier === 'Elite';

  const selectedBrandTheme = useMemo(() => getStoredChannelBrandTheme(channel.id), [channel.id]);

  const profileBrandStyle = {
    '--profile-brand-primary': selectedBrandTheme.primary,
    '--profile-brand-secondary': selectedBrandTheme.secondary,
    '--profile-brand-glow': selectedBrandTheme.glow,
  } as CSSProperties;

  const [subscribeNotice, setSubscribeNotice] = useState('');
  const [bannerNotice, setBannerNotice] = useState('');

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
    if (bannerAlertsEnabled) {
      unsubscribeFromChannelBannerAlerts(channel.id);
      setBannerNotice('Banner alerts turned off for ' + channel.name + '.');
      return;
    }

    const result = subscribeToChannelBannerAlerts(channel.id);

    if (!result.ok) {
      setBannerNotice('Could not enable banner alerts for this channel.');
      return;
    }

    if (result.alreadyEnabled) {
      setBannerNotice('Banner alerts are already enabled for ' + channel.name + '.');
      return;
    }

    setBannerNotice('Banner alerts enabled for ' + channel.name + '.');
    scheduleWelcomeBannerNotification(channel.id);
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
    profileBrandStyle,
    selectedBrandTheme,
    brandThemes: channelBrandThemes,
    subscribeNotice,
    bannerNotice,
    handleSubscribe,
    handleBannerAlertsToggle,
    handleSimulateSubscribedBurst,
  };
}
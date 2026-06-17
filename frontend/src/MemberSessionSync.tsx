import { useEffect, type ReactElement } from 'react';

import {
  fetchMemberPreferences,
  isMemberPreferencesApiAvailable,
  syncMemberPreferencesToBackend,
} from './member-preferences-api.js';
import { setChannelPreferencesSyncOwner } from './channel-cover-store.js';
import {
  readSelfAvatarOverride,
  saveSelfAvatarOverride,
  setMemberPreferencesSyncOwner,
} from './member-avatar-store.js';
import {
  readSelfStreamingOnline,
  setMemberOnlinePreferencesSyncOwner,
  setSelfStreamingOnline,
} from './member-online-store.js';
import {
  fetchMembershipSubscription,
  isMembershipSubscriptionApiAvailable,
  subscriptionToPlanState,
  syncMembershipSubscriptionToBackend,
} from './membership-subscriptions-api.js';
import {
  hydrateMembershipPlanState,
  readMembershipPlanState,
  setMembershipSubscriptionSyncOwner,
} from './membership-plans-store.js';
import { useProtocolOwner } from './wallet.js';

export function MemberSessionSync(): ReactElement | null {
  const { owner } = useProtocolOwner();

  useEffect(() => {
    setMembershipSubscriptionSyncOwner(owner);
    setMemberPreferencesSyncOwner(owner);
    setMemberOnlinePreferencesSyncOwner(owner);
    setChannelPreferencesSyncOwner(owner);

    if (!owner?.startsWith('0x')) {
      return;
    }

    void (async () => {
      if (isMembershipSubscriptionApiAvailable()) {
        try {
          const subscription = await fetchMembershipSubscription(owner);

          if (subscription) {
            hydrateMembershipPlanState(subscriptionToPlanState(subscription));
          } else {
            const local = readMembershipPlanState();
            await syncMembershipSubscriptionToBackend(local, owner);
          }
        } catch {
          // Subscription sync is best-effort during demo wiring.
        }
      }

      if (isMemberPreferencesApiAvailable()) {
        try {
          const preferences = await fetchMemberPreferences(owner);

          if (preferences) {
            if (preferences.avatarUrl) {
              saveSelfAvatarOverride(preferences.avatarUrl);
            }

            setSelfStreamingOnline(preferences.streamingOnline);
            return;
          }

          const localAvatar = readSelfAvatarOverride();

          await syncMemberPreferencesToBackend({
            owner,
            avatarUrl: localAvatar,
            streamingOnline: readSelfStreamingOnline(),
          });
        } catch {
          // Preference sync is best-effort during demo wiring.
        }
      }
    })();
  }, [owner]);

  return null;
}
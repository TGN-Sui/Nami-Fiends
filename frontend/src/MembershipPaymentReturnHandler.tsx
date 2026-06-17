import { useEffect, type ReactElement } from 'react';

import {
  confirmMockMembershipPayment,
  fetchMembershipPaymentIntent,
  isPaymentApiAvailable,
} from './membership-payments-api.js';
import {
  fetchMembershipSubscription,
  isMembershipSubscriptionApiAvailable,
  subscriptionToPlanState,
} from './membership-subscriptions-api.js';
import {
  finalizeMembershipUpgradeAfterPayment,
  hydrateMembershipPlanState,
  useMembershipPlanState,
} from './membership-plans-store.js';
import { useProtocolOwner } from './wallet.js';

export function MembershipPaymentReturnHandler(): ReactElement | null {
  const planState = useMembershipPlanState();
  const { owner } = useProtocolOwner();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const paymentId = params.get('payment_id');

    if (paymentStatus !== 'success' || !paymentId || !isPaymentApiAvailable()) {
      return;
    }

    void (async () => {
      try {
        let intent = await fetchMembershipPaymentIntent(paymentId);

        if (intent.status !== 'paid' && params.has('mock_session')) {
          intent = await confirmMockMembershipPayment(paymentId);
        }

        if (intent.status !== 'paid' && params.has('mock_paypal_order')) {
          intent = await confirmMockMembershipPayment(paymentId);
        }

        if (intent.status === 'paid') {
          if (isMembershipSubscriptionApiAvailable() && owner?.startsWith('0x')) {
            const subscription = await fetchMembershipSubscription(owner);

            if (subscription) {
              hydrateMembershipPlanState(subscriptionToPlanState(subscription));
            } else if (planState.status === 'pending-upgrade') {
              finalizeMembershipUpgradeAfterPayment(paymentId);
            }
          } else if (planState.status === 'pending-upgrade') {
            finalizeMembershipUpgradeAfterPayment(paymentId);
          }
        }
      } catch {
        // Payment return polling is best-effort until webhooks land.
      } finally {
        params.delete('payment');
        params.delete('payment_id');
        params.delete('mock_session');
        params.delete('mock_paypal_order');

        const next =
          window.location.pathname +
          (params.toString().length > 0 ? '?' + params.toString() : '') +
          window.location.hash;

        window.history.replaceState({}, '', next);
      }
    })();
  }, [owner, planState.status]);

  return null;
}
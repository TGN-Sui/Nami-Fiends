import { useEffect, type ReactElement } from 'react';

import {
  fetchMembershipPaymentIntent,
  isPaymentApiAvailable,
} from './membership-payments-api.js';
import {
  finalizeMembershipUpgradeAfterPayment,
  useMembershipPlanState,
} from './membership-plans-store.js';

export function MembershipPaymentReturnHandler(): ReactElement | null {
  const planState = useMembershipPlanState();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const paymentId = params.get('payment_id');

    if (paymentStatus !== 'success' || !paymentId || !isPaymentApiAvailable()) {
      return;
    }

    void (async () => {
      try {
        const intent = await fetchMembershipPaymentIntent(paymentId);

        if (intent.status === 'paid' && planState.status === 'pending-upgrade') {
          finalizeMembershipUpgradeAfterPayment(paymentId);
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
  }, [planState.status]);

  return null;
}
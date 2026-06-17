import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useState, type ReactElement } from 'react';

import { buildMembershipCryptoPaymentTransaction } from './membership-crypto-payment.js';
import {
  confirmCryptoMembershipPayment,
  confirmMockMembershipPayment,
  createMembershipPaymentIntent,
  fetchMembershipPaymentIntent,
  fetchPaymentConfig,
  isPaymentApiAvailable,
  type PaymentIntentResponse,
  type PublicPaymentConfig,
} from './membership-payments-api.js';
import {
  finalizeMembershipUpgradeAfterPayment,
  membershipCheckoutSelectionLabel,
  membershipPlanForTier,
  setMembershipPendingPaymentId,
  useMembershipPlanState,
} from './membership-plans-store.js';
import { useProtocolOwner } from './wallet.js';

type MembershipCheckoutPanelProps = {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
  onComplete?: () => void;
};

export function MembershipCheckoutPanel(props: MembershipCheckoutPanelProps): ReactElement | null {
  const planState = useMembershipPlanState();
  const { owner } = useProtocolOwner();
  const walletAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [loading, setLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PublicPaymentConfig | null>(null);
  const [checkout, setCheckout] = useState<PaymentIntentResponse | null>(null);

  const pendingTier = planState.pendingTier;
  const checkoutRail = planState.pendingCheckoutRail;
  const cryptoAsset = planState.pendingCryptoAsset;

  useEffect(() => {
    if (!isPaymentApiAvailable()) {
      return;
    }

    void fetchPaymentConfig()
      .then(setPaymentConfig)
      .catch(() => setPaymentConfig(null));
  }, []);

  if (planState.status !== 'pending-upgrade' || !pendingTier || !checkoutRail) {
    return null;
  }

  const plan = membershipPlanForTier(pendingTier);
  const payerAddress = walletAccount?.address ?? owner;

  async function beginCheckout(): Promise<void> {
    if (!pendingTier || !checkoutRail) {
      return;
    }

    if (!payerAddress?.startsWith('0x')) {
      props.onError('Connect your Sui wallet or sign in before checkout.');
      return;
    }

    if (checkoutRail === 'other' && !cryptoAsset) {
      props.onError('Choose SUI, USDC on Sui, or $GOON under Other.');
      return;
    }

    if (!isPaymentApiAvailable()) {
      props.onError('Payment API is offline. Set VITE_NAMI_INDEXER_URL and run the backend server.');
      return;
    }

    setLoading(true);

    try {
      const response = await createMembershipPaymentIntent({
        owner: payerAddress,
        tier: pendingTier,
        billingCycle: planState.billingCycle,
        rail: checkoutRail,
        cryptoAsset: checkoutRail === 'other' ? cryptoAsset : null,
      });

      setMembershipPendingPaymentId(response.intent.id);
      setCheckout(response);
      props.onNotice(
        'Checkout started via ' + membershipCheckoutSelectionLabel(checkoutRail, cryptoAsset) + '.'
      );

      if (checkoutRail === 'card' && response.card?.mode === 'stripe' && response.card.checkoutUrl) {
        window.location.assign(response.card.checkoutUrl);
      }

      if (checkoutRail === 'paypal' && response.paypal?.mode === 'paypal' && response.paypal.approvalUrl) {
        window.location.assign(response.paypal.approvalUrl);
      }
    } catch (error) {
      props.onError(error instanceof Error ? error.message : 'Could not start checkout.');
    } finally {
      setLoading(false);
    }
  }

  async function completePaidCheckout(paymentId: string): Promise<void> {
    const intent = await fetchMembershipPaymentIntent(paymentId);

    if (intent.status !== 'paid') {
      props.onError('Payment is not confirmed yet. Wait for provider settlement or retry.');
      return;
    }

    const result = finalizeMembershipUpgradeAfterPayment(paymentId);

    if (result.ok) {
      props.onNotice(result.message);
      props.onComplete?.();
      setCheckout(null);
    } else {
      props.onError(result.reason);
    }
  }

  async function handleMockProviderConfirm(): Promise<void> {
    if (!checkout?.intent.id) {
      return;
    }

    setLoading(true);

    try {
      await confirmMockMembershipPayment(checkout.intent.id);
      await completePaidCheckout(checkout.intent.id);
    } catch (error) {
      props.onError(error instanceof Error ? error.message : 'Mock payment failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCryptoPayment(): Promise<void> {
    if (!checkout?.crypto || !checkout.intent.id) {
      return;
    }

    if (!walletAccount?.address) {
      props.onError('Connect your Sui wallet to sign and send this payment.');
      return;
    }

    setLoading(true);

    try {
      let payerCoinObjectId: string | null = null;

      if (checkout.crypto.asset !== 'sui' && checkout.crypto.coinType) {
        const coins = await suiClient.getCoins({
          owner: walletAccount.address,
          coinType: checkout.crypto.coinType,
        });

        const spendable = coins.data.find(
          (coin) => BigInt(coin.balance) >= BigInt(checkout.crypto!.amountBaseUnits)
        );

        payerCoinObjectId = spendable?.coinObjectId ?? coins.data[0]?.coinObjectId ?? null;
      }

      const tx = buildMembershipCryptoPaymentTransaction({
        asset: checkout.crypto.asset === 'usdc' ? 'usdc-sui' : checkout.crypto.asset,
        treasuryAddress: checkout.crypto.treasuryAddress,
        amountBaseUnits: checkout.crypto.amountBaseUnits,
        coinType: checkout.crypto.coinType,
        payerCoinObjectId,
      });

      const result = await signAndExecute({ transaction: tx });
      const digest = result.digest;

      await confirmCryptoMembershipPayment({
        paymentId: checkout.intent.id,
        txDigest: digest,
        sender: walletAccount.address,
      });

      await completePaidCheckout(checkout.intent.id);
    } catch (error) {
      props.onError(error instanceof Error ? error.message : 'Wallet payment failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="panel membership-checkout-panel">
      <div className="membership-checkout-copy">
        <span className="mini-badge">Secure checkout</span>
        <h3>
          {plan.label} · {membershipCheckoutSelectionLabel(checkoutRail, cryptoAsset)}
        </h3>
        <p>
          Server-side receiving is enabled for card and PayPal (webhooks). SUI, USDC, and $GOON
          require a wallet signature sending funds to the Nami treasury address.
        </p>
      </div>

      {!checkout ? (
        <button
          className="primary-action membership-checkout-start-btn"
          disabled={loading}
          onClick={() => void beginCheckout()}
          type="button"
        >
          {loading ? 'Starting checkout…' : 'Continue to checkout'}
        </button>
      ) : (
        <div className="membership-checkout-active">
          <div className="membership-checkout-summary">
            <span>Payment ID</span>
            <strong>{checkout.intent.id}</strong>
            <span>Amount</span>
            <strong>${checkout.intent.amountUsd.toFixed(2)} USD</strong>
          </div>

          {checkoutRail === 'card' && checkout.card?.mode === 'mock' ? (
            <div className="membership-checkout-provider-panel">
              <p>Stripe is not configured — mock card checkout simulates server receipt + webhook.</p>
              <button
                className="primary-action"
                disabled={loading}
                onClick={() => void handleMockProviderConfirm()}
                type="button"
              >
                Simulate card payment
              </button>
            </div>
          ) : null}

          {checkoutRail === 'paypal' && checkout.paypal?.mode === 'mock' ? (
            <div className="membership-checkout-provider-panel">
              <p>PayPal is not configured — mock approval simulates capture on the receiving server.</p>
              <button
                className="primary-action"
                disabled={loading}
                onClick={() => void handleMockProviderConfirm()}
                type="button"
              >
                Simulate PayPal approval
              </button>
            </div>
          ) : null}

          {checkoutRail === 'other' && checkout.crypto ? (
            <div className="membership-checkout-provider-panel">
              <p>
                Send <strong>{checkout.crypto.amountLabel}</strong> to{' '}
                <code>{checkout.crypto.treasuryAddress}</code>
              </p>
              <p className="membership-checkout-wallet-hint">
                {walletAccount?.address
                  ? 'Wallet connected — sign the transfer in your wallet extension.'
                  : 'Connect your Sui wallet to sign and send this payment.'}
              </p>
              {!paymentConfig?.cryptoEnabled ? (
                <p className="membership-plan-notice is-error">
                  Treasury address is not configured on the receiving server.
                </p>
              ) : null}
              <button
                className="primary-action"
                disabled={loading || !walletAccount?.address || !paymentConfig?.cryptoEnabled}
                onClick={() => void handleCryptoPayment()}
                type="button"
              >
                {loading ? 'Awaiting wallet signature…' : 'Sign & send with wallet'}
              </button>
            </div>
          ) : null}

          {checkoutRail === 'card' && checkout.card?.mode === 'stripe' ? (
            <p className="protocol-hint">Redirecting to Stripe Checkout…</p>
          ) : null}

          {checkoutRail === 'paypal' && checkout.paypal?.mode === 'paypal' ? (
            <p className="protocol-hint">Redirecting to PayPal…</p>
          ) : null}
        </div>
      )}
    </article>
  );
}
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { isMockMembershipCheckoutEnabled } from './app-config.js';
import { giftTierLabel, type GiftCatalogEntry } from './gift-catalog.js';
import { hydrateGiftCatalog, useGiftCatalog } from './gift-catalog-store.js';
import { GiftIcon } from './GiftIcon.js';
import {
  confirmMockGiftPayment,
  createGiftPaymentIntent,
  fulfillGoonWalletGift,
  isGiftApiAvailable,
  type GiftPaymentRail,
  type GiftTargetType,
} from './gift-payments-api.js';
import { buildLocalGiftFulfillment, recordLocalGiftFulfillment } from './gift-store.js';
import { giftSendBlockReason, resolveGiftSenderOwner } from './gift-send-eligibility.js';
import { getSelfMember } from './member-access.js';
import { goonAmountToBaseUnits, NAMI_GOON_SYMBOL } from './goon-token.js';
import { buildGoonTransferTransaction, resolveGoonCoinType } from './goon-wallet-payment.js';
import { fetchPaymentConfig, isPaymentApiAvailable } from './membership-payments-api.js';
import { readWalletAuthRequired } from './protocol-env.js';
import { isSelfMember } from './surface-preferences.js';
import type { NamiMember } from './uiMockData.js';
import { createGiftPaymentAuthPayload, describeGiftPaymentAuthFailure } from './wallet-auth.js';
import { useProtocolOwner } from './wallet.js';
import { canZkLoginSignForOwner } from './zklogin.js';

export type GiftSendTarget = {
  targetType: GiftTargetType;
  targetMember: NamiMember;
  streamKey?: string;
  streamTitle?: string;
  channelOwnerMemberId?: string;
};

type GiftSendPanelProps = {
  target: GiftSendTarget;
  layout?: 'default' | 'composer-popover';
  onClose?: () => void;
  onSent?: (message: string) => void;
};

export function GiftSendPanel(props: GiftSendPanelProps): ReactElement {
  const selfMember = getSelfMember();
  const { owner } = useProtocolOwner();
  const walletAccount = useCurrentAccount();
  const senderOwner = resolveGiftSenderOwner(owner, walletAccount?.address ?? null);
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const catalog = useGiftCatalog();
  const [selectedGiftId, setSelectedGiftId] = useState(catalog[0]?.id ?? 'goon-pop');
  const [rail, setRail] = useState<GiftPaymentRail>('goon_wallet');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [goonCoinType, setGoonCoinType] = useState(resolveGoonCoinType(null));
  const [cardEnabled, setCardEnabled] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [mockCheckoutEnabled, setMockCheckoutEnabled] = useState(isMockMembershipCheckoutEnabled());

  const selectedGift = useMemo(
    () => catalog.find((gift) => gift.id === selectedGiftId) ?? catalog[0] ?? null,
    [catalog, selectedGiftId]
  );

  useEffect(() => {
    if (!catalog.some((gift) => gift.id === selectedGiftId) && catalog[0]) {
      setSelectedGiftId(catalog[0].id);
    }
  }, [catalog, selectedGiftId]);

  const sendBlockReason = giftSendBlockReason({
    targetMemberId: props.target.targetMember.id,
    senderOwner,
    selfMember,
  });
  const canSend = sendBlockReason === null;

  useEffect(() => {
    if (!isPaymentApiAvailable()) {
      return;
    }

    void fetchPaymentConfig()
      .then((config) => {
        setGoonCoinType(resolveGoonCoinType(config.goonCoinType));
        setCardEnabled(config.cardEnabled);
        setPaypalEnabled(config.paypalEnabled);
        setMockCheckoutEnabled(config.mockProviders || isMockMembershipCheckoutEnabled());
      })
      .catch(() => {
        setGoonCoinType(resolveGoonCoinType(null));
      });
  }, []);

  useEffect(() => {
    if (!isGiftApiAvailable()) {
      return;
    }

    void hydrateGiftCatalog();
  }, []);

  function renderGiftButton(gift: GiftCatalogEntry): ReactElement {
    return (
      <button
        aria-pressed={selectedGiftId === gift.id}
        className={
          'gift-send-picker-item gift-send-picker-item-' +
          gift.tier +
          (selectedGiftId === gift.id ? ' is-selected-gift' : '')
        }
        key={gift.id}
        onClick={() => setSelectedGiftId(gift.id)}
        type="button"
      >
        <GiftIcon
          className="gift-send-picker-emoji"
          emoji={gift.emoji}
          iconUrl={gift.iconUrl}
          imageClassName="gift-send-picker-icon"
        />
        <span className="gift-send-picker-label">{gift.label}</span>
        <small>
          {gift.goonAmount} {NAMI_GOON_SYMBOL}
        </small>
      </button>
    );
  }

  async function sendGift(): Promise<void> {
    if (!selectedGift) {
      setStatus('Gift catalog is still loading.');
      return;
    }

    if (!canSend) {
      setStatus(sendBlockReason ?? 'You cannot send gifts in this context.');
      return;
    }

    if (!senderOwner?.startsWith('0x')) {
      setStatus('Connect your Sui wallet or sign in with Google to send gifts.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      if (!isGiftApiAvailable()) {
        setStatus('Gift API is offline. Set VITE_NAMI_INDEXER_URL and run the backend server.');
        return;
      }

      let auth: Awaited<ReturnType<typeof createGiftPaymentAuthPayload>> | undefined;

      if (readWalletAuthRequired()) {
        auth = await createGiftPaymentAuthPayload(senderOwner);

        if (!auth?.signature || !Number.isFinite(auth.timestampMs)) {
          setStatus(describeGiftPaymentAuthFailure(senderOwner));
          return;
        }

        if (canZkLoginSignForOwner(senderOwner) && !auth.signerAddress) {
          setStatus('zkLogin signing key is missing. Sign out and sign in with Google again.');
          return;
        }
      }

      const response = await createGiftPaymentIntent({
        senderOwner,
        senderMemberId: selfMember.id,
        senderMemberName: selfMember.name,
        giftId: selectedGift.id,
        targetType: props.target.targetType,
        targetMemberId: props.target.targetMember.id,
        targetMemberName: props.target.targetMember.name,
        streamKey: props.target.streamKey ?? null,
        streamTitle: props.target.streamTitle ?? null,
        channelOwnerMemberId: props.target.channelOwnerMemberId ?? null,
        rail,
        ...(auth
          ? {
              auth: {
                signature: auth.signature,
                timestampMs: auth.timestampMs,
                ...(auth.signerAddress ? { signerAddress: auth.signerAddress } : {}),
              },
            }
          : {}),
      });

      if (rail === 'card') {
        if (response.card?.mode === 'stripe' && response.card.checkoutUrl) {
          window.location.assign(response.card.checkoutUrl);
          return;
        }

        if (response.card?.mode === 'mock' && mockCheckoutEnabled) {
          const confirmed = await confirmMockGiftPayment(response.intent.id);
          recordLocalGiftFulfillment(confirmed.fulfillment);
          const message =
            'Sent ' +
            selectedGift.label +
            ' to ' +
            props.target.targetMember.name +
            ' (mock card).';
          props.onSent?.(message);
          setStatus(message);
          props.onClose?.();
          return;
        }

        setStatus('Card checkout is not configured for gifts on this build.');
        return;
      }

      if (rail === 'paypal') {
        if (response.paypal?.mode === 'paypal' && response.paypal.approvalUrl) {
          window.location.assign(response.paypal.approvalUrl);
          return;
        }

        if (response.paypal?.mode === 'mock' && mockCheckoutEnabled) {
          const confirmed = await confirmMockGiftPayment(response.intent.id);
          recordLocalGiftFulfillment(confirmed.fulfillment);
          const message =
            'Sent ' +
            selectedGift.label +
            ' to ' +
            props.target.targetMember.name +
            ' (mock PayPal).';
          props.onSent?.(message);
          setStatus(message);
          props.onClose?.();
          return;
        }

        setStatus('PayPal checkout is not configured for gifts on this build.');
        return;
      }

      const checkout = response.goonWallet;

      if (!checkout?.treasuryAddress) {
        setStatus('Gift treasury routing is not configured on the server.');
        return;
      }

      const coins = await suiClient.getCoins({
        owner: senderOwner,
        coinType: goonCoinType,
      });
      const amountBaseUnits = goonAmountToBaseUnits(selectedGift.goonAmount);
      const spendable = coins.data.find((coin) => BigInt(coin.balance) >= BigInt(amountBaseUnits));

      if (!spendable) {
        setStatus('Not enough ' + NAMI_GOON_SYMBOL + ' in your wallet for this gift.');
        return;
      }

      const tx = buildGoonTransferTransaction({
        recipientAddress: checkout.treasuryAddress,
        amountGoon: selectedGift.goonAmount,
        payerCoinObjectId: spendable.coinObjectId,
        coinType: goonCoinType,
      });

      const result = await signAndExecute({ transaction: tx });

      try {
        const fulfilled = await fulfillGoonWalletGift({
          paymentId: response.intent.id,
          txDigest: result.digest,
          sender: senderOwner,
          ...(auth
            ? {
                auth: {
                  signature: auth.signature,
                  timestampMs: auth.timestampMs,
                  ...(auth.signerAddress ? { signerAddress: auth.signerAddress } : {}),
                },
              }
            : {}),
        });
        recordLocalGiftFulfillment(fulfilled.fulfillment);
      } catch {
        const local = buildLocalGiftFulfillment({
          giftId: selectedGift.id,
          senderOwner,
          senderMemberId: selfMember.id,
          senderMemberName: selfMember.name,
          targetType: props.target.targetType,
          targetMemberId: props.target.targetMember.id,
          targetMemberName: props.target.targetMember.name,
          streamKey: props.target.streamKey ?? null,
          streamTitle: props.target.streamTitle ?? null,
          txDigest: result.digest,
        });

        if (local) {
          recordLocalGiftFulfillment(local);
        }
      }

      const message =
        'Sent ' +
        selectedGift.emoji +
        ' ' +
        selectedGift.label +
        ' to ' +
        props.target.targetMember.name +
        ' (tx ' +
        result.digest.slice(0, 10) +
        '…).';

      props.onSent?.(message);
      setStatus(message);
      props.onClose?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Gift send failed.');
    } finally {
      setLoading(false);
    }
  }

  const isComposerPopover = props.layout === 'composer-popover';

  if (!selectedGift) {
    return (
      <div
        className={
          'gift-send-panel' + (isComposerPopover ? ' gift-send-panel-composer-popover' : '')
        }
      >
        <p className="gift-send-hint">Loading gift catalog…</p>
      </div>
    );
  }

  return (
    <div
      className={'gift-send-panel' + (isComposerPopover ? ' gift-send-panel-composer-popover' : '')}
    >
      {!isComposerPopover ? (
        <div className="gift-send-panel-head">
          <div>
            <strong>Send Gift</strong>
            <p>
              {props.target.targetType === 'stream'
                ? 'Celebrate the live stream with a tiered gift animation.'
                : 'Send a showcase gift to ' + props.target.targetMember.name + '.'}
            </p>
          </div>
          {props.onClose ? (
            <button className="profile-secondary-link" onClick={props.onClose} type="button">
              Close
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="gift-send-tier-groups">
        {(['common', 'rare', 'legendary'] as const).map((tier) => (
          <section className="gift-send-tier-group" key={tier}>
            <h3>{giftTierLabel(tier)}</h3>
            <div className="gift-send-picker-grid">
              {catalog.filter((gift) => gift.tier === tier).map(renderGiftButton)}
            </div>
          </section>
        ))}
      </div>

      <div className="gift-send-rail-row">
        <span>Pay with</span>
        <div className="gift-send-rail-options">
          <button
            aria-pressed={rail === 'goon_wallet'}
            className={'nami-surface-button' + (rail === 'goon_wallet' ? ' is-active-surface-button' : '')}
            onClick={() => setRail('goon_wallet')}
            type="button"
          >
            {NAMI_GOON_SYMBOL} wallet
          </button>
          {cardEnabled || mockCheckoutEnabled ? (
            <button
              aria-pressed={rail === 'card'}
              className={'nami-surface-button' + (rail === 'card' ? ' is-active-surface-button' : '')}
              onClick={() => setRail('card')}
              type="button"
            >
              Card
            </button>
          ) : null}
          {paypalEnabled || mockCheckoutEnabled ? (
            <button
              aria-pressed={rail === 'paypal'}
              className={'nami-surface-button' + (rail === 'paypal' ? ' is-active-surface-button' : '')}
              onClick={() => setRail('paypal')}
              type="button"
            >
              PayPal
            </button>
          ) : null}
        </div>
      </div>

      <p className="gift-send-selection-summary">
        Selected: <strong>{selectedGift.label}</strong> —{' '}
        {selectedGift.goonAmount.toLocaleString()} {NAMI_GOON_SYMBOL} (${selectedGift.priceUsd.toFixed(2)})
      </p>

      <button
        className="primary-action gift-send-submit"
        disabled={loading || !canSend}
        onClick={() => void sendGift()}
        type="button"
      >
        {loading ? 'Waiting for wallet…' : 'Send gift'}
      </button>

      {!canSend && sendBlockReason ? (
        <p className="gift-send-hint">{sendBlockReason}</p>
      ) : null}

      {status ? <p className="gift-send-status">{status}</p> : null}
    </div>
  );
}
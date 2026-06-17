import { useState, type ReactElement } from 'react';

import {
  MEMBERSHIP_CHECKOUT_RAILS,
  MEMBERSHIP_CRYPTO_ASSETS,
  type MembershipCheckoutRail,
  type MembershipCryptoAsset,
} from './membership-plans-store.js';

type MembershipPaymentMethodsProps = {
  selectedRail: MembershipCheckoutRail;
  selectedCryptoAsset: MembershipCryptoAsset | null;
  onSelectRail: (rail: MembershipCheckoutRail) => void;
  onSelectCryptoAsset: (asset: MembershipCryptoAsset) => void;
  compact?: boolean;
};

export function MembershipPaymentMethods(props: MembershipPaymentMethodsProps): ReactElement {
  const [otherExpanded, setOtherExpanded] = useState(props.selectedRail === 'other');

  function handleRailSelect(rail: MembershipCheckoutRail): void {
    props.onSelectRail(rail);

    if (rail === 'other') {
      setOtherExpanded(true);

      if (!props.selectedCryptoAsset) {
        props.onSelectCryptoAsset('sui');
      }

      return;
    }

    setOtherExpanded(false);
  }

  return (
    <div
      className={'membership-payment-methods' + (props.compact ? ' is-compact-payment-methods' : '')}
      role="radiogroup"
      aria-label="Payment method"
    >
      <div className="membership-payment-methods-heading">
        <span className="mini-badge">Checkout</span>
        <strong>Payment method</strong>
        <p>Credit/debit card and PayPal settle on Nami servers. Other opens SUI, USDC, or $GOON wallet pay.</p>
      </div>

      <div className="membership-payment-method-grid is-three-rail-grid">
        {MEMBERSHIP_CHECKOUT_RAILS.map((rail) => {
          const selected = props.selectedRail === rail.id;

          return (
            <button
              aria-checked={selected}
              className={'membership-payment-method-card' + (selected ? ' is-selected-payment-method' : '')}
              key={rail.id}
              onClick={() => handleRailSelect(rail.id)}
              role="radio"
              type="button"
            >
              <strong>{rail.label}</strong>
              <span>{rail.hint}</span>
            </button>
          );
        })}
      </div>

      {otherExpanded || props.selectedRail === 'other' ? (
        <div className="membership-crypto-asset-picker" role="radiogroup" aria-label="Other payment asset">
          <span className="membership-crypto-asset-picker-label">Choose asset</span>
          <div className="membership-crypto-asset-grid">
            {MEMBERSHIP_CRYPTO_ASSETS.map((asset) => {
              const selected = props.selectedCryptoAsset === asset.id;

              return (
                <button
                  aria-checked={selected}
                  className={
                    'membership-crypto-asset-chip' + (selected ? ' is-selected-crypto-asset' : '')
                  }
                  key={asset.id}
                  onClick={() => {
                    props.onSelectRail('other');
                    props.onSelectCryptoAsset(asset.id);
                    setOtherExpanded(true);
                  }}
                  role="radio"
                  type="button"
                >
                  <strong>{asset.label}</strong>
                  <span>{asset.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
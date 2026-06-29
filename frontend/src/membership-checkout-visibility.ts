import type { PublicPaymentConfig } from './membership-payments-api.js';
import {
  MEMBERSHIP_CHECKOUT_RAILS,
  type MembershipCheckoutRail,
} from './membership-plans-store.js';

export function resolveVisibleCheckoutRails(
  paymentConfig: PublicPaymentConfig | null | undefined
): MembershipCheckoutRail[] {
  const rails: MembershipCheckoutRail[] = [];

  if (paymentConfig?.cardEnabled) {
    rails.push('card');
  }

  if (paymentConfig?.paypalEnabled) {
    rails.push('paypal');
  }

  if (paymentConfig == null || paymentConfig.cryptoEnabled) {
    rails.push('other');
  }

  if (rails.length > 0) {
    return rails;
  }

  return ['other'];
}

export function defaultCheckoutRail(
  paymentConfig: PublicPaymentConfig | null | undefined
): MembershipCheckoutRail {
  const visible = resolveVisibleCheckoutRails(paymentConfig);

  if (visible.includes('other')) {
    return 'other';
  }

  if (visible.includes('paypal')) {
    return 'paypal';
  }

  return visible[0] ?? 'other';
}

export function checkoutRailLabel(rail: MembershipCheckoutRail): string {
  return MEMBERSHIP_CHECKOUT_RAILS.find((entry) => entry.id === rail)?.label ?? rail;
}

export function membershipCheckoutMethodsSummary(
  paymentConfig: PublicPaymentConfig | null | undefined
): string {
  const labels = resolveVisibleCheckoutRails(paymentConfig).map((rail) => {
    if (rail === 'card') {
      return 'credit/debit card';
    }

    if (rail === 'paypal') {
      return 'PayPal';
    }

    return 'wallet crypto (SUI, USDC, $GOON)';
  });

  if (labels.length === 0) {
    return 'wallet crypto (SUI, USDC, $GOON)';
  }

  if (labels.length === 1) {
    return labels[0] ?? 'wallet crypto';
  }

  if (labels.length === 2) {
    return labels[0] + ' or ' + labels[1];
  }

  return labels.slice(0, -1).join(', ') + ', or ' + labels[labels.length - 1];
}
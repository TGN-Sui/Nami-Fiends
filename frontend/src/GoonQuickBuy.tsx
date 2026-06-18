import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState, type ReactElement } from 'react';

import { recordGoonPurchase } from './goon-tips-store.js';
import {
  buildGoonSwapUrl,
  formatGoonCoinTypeLabel,
  GOON_DEFAULT_BUY_AMOUNT,
  GOON_QUICK_BUY_AMOUNTS,
  NAMI_GOON_SYMBOL,
  readConfiguredGoonCoinType,
} from './goon-token.js';
import { fetchPaymentConfig, isPaymentApiAvailable } from './membership-payments-api.js';
import { resolveGoonCoinType } from './goon-wallet-payment.js';

export function GoonQuickBuy(props: {
  onClose?: () => void;
}): ReactElement {
  const walletAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [amount, setAmount] = useState(GOON_DEFAULT_BUY_AMOUNT);
  const [status, setStatus] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [goonCoinType, setGoonCoinType] = useState(readConfiguredGoonCoinType());

  useEffect(() => {
    if (!isPaymentApiAvailable()) {
      return;
    }

    void fetchPaymentConfig()
      .then((config) => setGoonCoinType(resolveGoonCoinType(config.goonCoinType)))
      .catch(() => setGoonCoinType(readConfiguredGoonCoinType()));
  }, []);

  useEffect(() => {
    if (!walletAccount?.address) {
      setBalance(null);
      return;
    }

    void suiClient
      .getBalance({ owner: walletAccount.address, coinType: goonCoinType })
      .then((result) => {
        const whole = Number(result.totalBalance) / 10 ** 9;
        setBalance(whole.toLocaleString(undefined, { maximumFractionDigits: 4 }));
      })
      .catch(() => setBalance(null));
  }, [goonCoinType, suiClient, walletAccount?.address]);

  async function buyNow(): Promise<void> {
    if (!walletAccount?.address) {
      setStatus('Connect your Sui wallet first, then tap Buy again.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const result = recordGoonPurchase(amount);

      if (!result.ok) {
        setStatus(result.reason);
        return;
      }

      window.open(buildGoonSwapUrl(goonCoinType), '_blank', 'noopener,noreferrer');

      const balanceResult = await suiClient.getBalance({
        owner: walletAccount.address,
        coinType: goonCoinType,
      });
      const whole = Number(balanceResult.totalBalance) / 10 ** 9;

      setBalance(whole.toLocaleString(undefined, { maximumFractionDigits: 4 }));
      setStatus(
        'Swap opened — confirm in your wallet to receive ' +
          amount.toLocaleString() +
          ' ' +
          NAMI_GOON_SYMBOL +
          '.'
      );
      props.onClose?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start ' + NAMI_GOON_SYMBOL + ' purchase.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="goon-quick-buy">
      <div className="goon-quick-buy-head">
        <div>
          <strong>Buy {NAMI_GOON_SYMBOL}</strong>
          <p>Pick an amount and confirm once — we open the swap for you.</p>
        </div>
        {props.onClose ? (
          <button className="profile-secondary-link" onClick={props.onClose} type="button">
            Close
          </button>
        ) : null}
      </div>

      <div className="goon-quick-buy-amounts">
        {GOON_QUICK_BUY_AMOUNTS.map((preset) => (
          <button
            aria-pressed={amount === preset}
            className={'goon-quick-buy-amount' + (amount === preset ? ' is-selected' : '')}
            key={preset}
            onClick={() => setAmount(preset)}
            type="button"
          >
            {preset}
          </button>
        ))}
      </div>

      {balance !== null ? (
        <p className="goon-quick-buy-balance">
          Wallet: <strong>{balance}</strong> {NAMI_GOON_SYMBOL}
        </p>
      ) : null}

      <button
        className="primary-action goon-quick-buy-cta"
        disabled={loading}
        onClick={() => void buyNow()}
        type="button"
      >
        {loading
          ? 'Opening swap…'
          : 'Buy ' + amount.toLocaleString() + ' ' + NAMI_GOON_SYMBOL}
      </button>

      <small className="goon-quick-buy-token" title={goonCoinType}>
        Token {formatGoonCoinTypeLabel(goonCoinType)}
      </small>

      {status ? <p className="goon-quick-buy-status">{status}</p> : null}
    </div>
  );
}
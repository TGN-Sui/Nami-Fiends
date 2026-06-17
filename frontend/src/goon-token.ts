/** Canonical $GOON coin type on Sui (testnet). */
export const NAMI_GOON_COIN_TYPE =
  '0xc31be4b73d3352373c9e2d99e8620944f414b24407495b1d0c9f5628e2e86104::goon::GOON';

export const NAMI_GOON_DECIMALS = 9;

export const NAMI_GOON_SYMBOL = '$GOON';

export function readConfiguredGoonCoinType(): string {
  const fromEnv = import.meta.env.VITE_NAMI_GOON_COIN_TYPE;

  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  return NAMI_GOON_COIN_TYPE;
}

export function goonAmountToBaseUnits(amount: number): string {
  const scaled = Math.round(amount * 10 ** NAMI_GOON_DECIMALS);

  return BigInt(Math.max(0, scaled)).toString();
}

export function formatGoonCoinTypeLabel(coinType: string): string {
  if (coinType.length <= 42) {
    return coinType;
  }

  return coinType.slice(0, 18) + '…' + coinType.slice(-16);
}
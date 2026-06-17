import { Transaction } from '@mysten/sui/transactions';

import type { MembershipCryptoAsset } from './membership-plans-store.js';

export type CryptoPaymentBuildInput = {
  asset: MembershipCryptoAsset;
  treasuryAddress: string;
  amountBaseUnits: string;
  coinType: string | null;
  payerCoinObjectId?: string | null;
};

export function buildMembershipCryptoPaymentTransaction(input: CryptoPaymentBuildInput): Transaction {
  const tx = new Transaction();
  const amount = BigInt(input.amountBaseUnits);

  if (input.asset === 'sui') {
    const [coin] = tx.splitCoins(tx.gas, [amount]);
    tx.transferObjects([coin], input.treasuryAddress);
    return tx;
  }

  if (!input.payerCoinObjectId) {
    throw new Error('No spendable coin object found in the connected wallet.');
  }

  if (!input.coinType) {
    throw new Error('Token coin type is not configured for this checkout.');
  }

  const [coin] = tx.splitCoins(tx.object(input.payerCoinObjectId), [amount]);
  tx.transferObjects([coin], input.treasuryAddress);

  return tx;
}

export function mapFrontendCryptoAssetToBackend(
  asset: MembershipCryptoAsset
): 'sui' | 'usdc' | 'goon' {
  return asset === 'usdc-sui' ? 'usdc' : asset;
}
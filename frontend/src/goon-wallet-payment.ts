import { Transaction } from '@mysten/sui/transactions';

import { goonAmountToBaseUnits, readConfiguredGoonCoinType } from './goon-token.js';

export function buildGoonTransferTransaction(input: {
  recipientAddress: string;
  amountGoon: number;
  payerCoinObjectId: string;
  coinType?: string;
}): Transaction {
  const tx = new Transaction();
  const amount = BigInt(goonAmountToBaseUnits(input.amountGoon));
  const [coin] = tx.splitCoins(tx.object(input.payerCoinObjectId), [amount]);
  tx.transferObjects([coin], input.recipientAddress);

  return tx;
}

export function resolveGoonCoinType(serverCoinType: string | null | undefined): string {
  if (typeof serverCoinType === 'string' && serverCoinType.trim().length > 0) {
    return serverCoinType.trim();
  }

  return readConfiguredGoonCoinType();
}
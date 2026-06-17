import { Transaction } from '@mysten/sui/transactions';

import {
  enterNamiMoveTarget,
  validateEnterNamiParams,
  type EnterNamiParams,
} from '@nami/sdk';

/**
 * Builds the target single-PTB onboarding claim in the frontend package graph.
 * Requires `nami::onboarding::enter_nami` on the deployed package (not yet in contracts).
 */
export function buildEnterNamiTransaction(
  packageId: string,
  params: EnterNamiParams
): Transaction {
  const validated = validateEnterNamiParams(params);
  const tx = new Transaction();

  tx.moveCall({
    target: enterNamiMoveTarget(packageId),
    arguments: [
      tx.pure.string(validated.nodename),
      tx.pure.string(validated.displayName),
      tx.pure.u8(validated.archetype),
    ],
  });

  return tx;
}
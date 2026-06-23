import { Transaction } from '@mysten/sui/transactions';

import {
  enterNamiMoveTarget,
  validateEnterNamiParams,
  type EnterNamiParams,
} from '@nami/sdk';

/**
 * Builds the target single-PTB onboarding claim in the frontend package graph.
 * Requires published `nami::onboarding::enter_nami` and the shared NodenameRegistry object id.
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
      tx.object(validated.nodenameRegistryId),
      tx.pure.string(validated.nodename),
      tx.pure.u8(validated.archetype),
      tx.pure.string(validated.avatarRef),
    ],
  });

  return tx;
}
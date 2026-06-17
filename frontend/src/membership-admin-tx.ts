import { Transaction } from '@mysten/sui/transactions';

export type AdminMembershipTier = 'Pro' | 'Elite';

export function buildMembershipAdminUpgradeTransaction(input: {
  packageId: string;
  adminCapId: string;
  passportId: string;
  tier: AdminMembershipTier;
  expiresAtMs: number;
}): Transaction {
  const tx = new Transaction();
  const target =
    input.tier === 'Pro'
      ? input.packageId + '::admin::upgrade_to_pro'
      : input.packageId + '::admin::upgrade_to_elite';

  tx.moveCall({
    target,
    arguments: [
      tx.object(input.adminCapId),
      tx.object(input.passportId),
      tx.pure.u64(input.expiresAtMs),
    ],
  });

  return tx;
}
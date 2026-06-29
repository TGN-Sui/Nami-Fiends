import type { SealEvidencePolicy } from './seal-privacy.service.js';

export type SealPolicyMigrationStage = 'dev-envelope' | 'mysten-seal-v1' | 'walrus-ciphertext';

export type SealPolicyDefinition = {
  policy: SealEvidencePolicy;
  label: string;
  description: string;
  /** Placeholder Mysten Seal policy object id — set after 9.2.2 policy publish. */
  mysten_policy_id: string | null;
  /** Walrus blob namespace for ciphertext once 9.2.2 ships. */
  walrus_blob_prefix: string;
  migration_stage: SealPolicyMigrationStage;
};

export const SEAL_POLICY_REGISTRY: Record<SealEvidencePolicy, SealPolicyDefinition> = {
  appeal_evidence: {
    policy: 'appeal_evidence',
    label: 'Appeal evidence',
    description: 'Appellant uploads context for AppealCase review.',
    mysten_policy_id: null,
    walrus_blob_prefix: 'seal/appeal/',
    migration_stage: 'dev-envelope',
  },
  moderation_packet: {
    policy: 'moderation_packet',
    label: 'Moderation packet',
    description: 'Officials-only moderator notes and attachments.',
    mysten_policy_id: null,
    walrus_blob_prefix: 'seal/moderation/',
    migration_stage: 'dev-envelope',
  },
  recovery_attachment: {
    policy: 'recovery_attachment',
    label: 'Recovery attachment',
    description: 'Account recovery sensitive proof.',
    mysten_policy_id: null,
    walrus_blob_prefix: 'seal/recovery/',
    migration_stage: 'dev-envelope',
  },
  verification_proof: {
    policy: 'verification_proof',
    label: 'Verification proof',
    description: 'Linked-account verification without public PII.',
    mysten_policy_id: null,
    walrus_blob_prefix: 'seal/verification/',
    migration_stage: 'dev-envelope',
  },
  reward_escrow: {
    policy: 'reward_escrow',
    label: 'Reward escrow',
    description:
      'Gamer-locked event gifts and cosmetics — sealed until unlock condition is met or manually transferred.',
    mysten_policy_id: null,
    walrus_blob_prefix: 'seal/reward/',
    migration_stage: 'dev-envelope',
  },
};

export function listSealPolicyDefinitions(): SealPolicyDefinition[] {
  return Object.values(SEAL_POLICY_REGISTRY);
}

export function resolveSealPolicyDefinition(policy: SealEvidencePolicy): SealPolicyDefinition {
  return SEAL_POLICY_REGISTRY[policy];
}

export function sealPolicyMigrationSummary(): {
  stage: SealPolicyMigrationStage;
  policies_with_mysten_ids: number;
  policies_total: number;
  next_step: string;
} {
  const policies = listSealPolicyDefinitions();
  const withMystenIds = policies.filter((entry) => Boolean(entry.mysten_policy_id)).length;

  return {
    stage: withMystenIds > 0 ? 'mysten-seal-v1' : 'dev-envelope',
    policies_with_mysten_ids: withMystenIds,
    policies_total: policies.length,
    next_step:
      withMystenIds > 0
        ? 'Wire Mysten Seal decrypt path and Walrus ciphertext upload in 9.2.3.'
        : 'Publish Mysten Seal policy objects and set mysten_policy_id per policy (9.2.2).',
  };
}
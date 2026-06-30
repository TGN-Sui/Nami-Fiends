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
      'Event-attached cosmetics and badges only — Nami owner seals the host attachment, then gamers lock in until the event condition is met or they gift manually.',
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

export type SealPolicyMigrationContext = {
  walrus_publisher_configured?: boolean;
  walrus_ciphertext_count?: number;
};

export function sealPolicyMigrationSummary(
  context: SealPolicyMigrationContext = {}
): {
  stage: SealPolicyMigrationStage;
  policies_with_mysten_ids: number;
  policies_total: number;
  walrus_ciphertext_count: number;
  next_step: string;
} {
  const policies = listSealPolicyDefinitions();
  const withMystenIds = policies.filter((entry) => Boolean(entry.mysten_policy_id)).length;
  const walrusCount = context.walrus_ciphertext_count ?? 0;
  const walrusConfigured = context.walrus_publisher_configured ?? false;

  let stage: SealPolicyMigrationStage = 'dev-envelope';
  let nextStep =
    'Publish Mysten Seal policy objects and set mysten_policy_id per policy (9.2.x when APIs stabilize).';

  if (withMystenIds > 0) {
    stage = 'mysten-seal-v1';
    nextStep = 'Wire Mysten Seal decrypt path for jury and officials roles.';
  } else if (walrusConfigured || walrusCount > 0) {
    stage = 'walrus-ciphertext';
    nextStep =
      'Mysten Seal policy ids remain future 9.2.x — ciphertext already offloaded to Walrus when publisher is configured.';
  }

  return {
    stage,
    policies_with_mysten_ids: withMystenIds,
    policies_total: policies.length,
    walrus_ciphertext_count: walrusCount,
    next_step: nextStep,
  };
}
export type SuinsProvisionStatus =
  | 'provisioned'
  | 'pending_operator'
  | 'skipped'
  | 'failed';

export type SuinsProvisionResult = {
  status: SuinsProvisionStatus;
  subname: string;
  txDigest: string | null;
  message: string;
};

export function readSuinsParentName(): string {
  return process.env.NAMI_SUINS_PARENT_NAME?.trim().toLowerCase() || 'fiend';
}

export function isSuinsOperatorConfigured(): boolean {
  return Boolean(process.env.NAMI_SUINS_OPERATOR_PRIVATE_KEY?.trim());
}

export function buildSuinsSubname(suffix: string): string {
  const normalizedSuffix = suffix.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (!normalizedSuffix) {
    throw new Error('suins_subname_suffix_required');
  }

  return normalizedSuffix + '.' + readSuinsParentName();
}

export function nodenameSuffixFromClaim(nodename: string): string {
  const normalized = nodename.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (normalized.startsWith('fiend')) {
    return normalized.slice('fiend'.length);
  }

  if (normalized.startsWith('nami')) {
    return normalized.slice('nami'.length);
  }

  return normalized;
}

/**
 * Provisions a SuiNS subname under the configured parent (default: fiend).
 * When NAMI_SUINS_OPERATOR_PRIVATE_KEY is unset, returns pending_operator for owner retry.
 */
export async function provisionSuinsSubname(input: {
  nodename: string;
  recipientAddress: string | null;
}): Promise<SuinsProvisionResult> {
  const suffix = nodenameSuffixFromClaim(input.nodename);
  const subname = buildSuinsSubname(suffix);

  if (!isSuinsOperatorConfigured()) {
    return {
      status: 'pending_operator',
      subname,
      txDigest: null,
      message:
        'SuiNS operator credentials are not configured. Set NAMI_SUINS_OPERATOR_PRIVATE_KEY to automate subname minting.',
    };
  }

  try {
    // SuiNS SDK wiring lands in a follow-up; operator key presence reserves the automation slot.
    console.info(
      '[nami-suins] queued subname provision',
      subname,
      'recipient',
      input.recipientAddress ?? 'unlinked'
    );

    return {
      status: 'skipped',
      subname,
      txDigest: null,
      message:
        'Operator credentials detected. SuiNS mint PTB hooks are pending SDK wiring — nodename registry proceeds.',
    };
  } catch (error) {
    return {
      status: 'failed',
      subname,
      txDigest: null,
      message: error instanceof Error ? error.message : 'SuiNS provisioning failed.',
    };
  }
}
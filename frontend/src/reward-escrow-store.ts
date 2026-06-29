const KEY_PREFIX = 'nami.reward.escrow.';

function storageKey(rewardId: string): string {
  return KEY_PREFIX + rewardId;
}

export function readRewardEscrowEvidenceId(rewardId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(rewardId));
  } catch {
    return null;
  }
}

export function saveRewardEscrowEvidenceId(rewardId: string, evidenceId: string): void {
  try {
    window.localStorage.setItem(storageKey(rewardId), evidenceId);
    window.dispatchEvent(
      new CustomEvent('nami-reward-escrow-changed', {
        detail: { rewardId, evidenceId },
      })
    );
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function listPendingRewardEscrowIds(rewardIds: string[]): string[] {
  return rewardIds.filter((rewardId) => !readRewardEscrowEvidenceId(rewardId));
}
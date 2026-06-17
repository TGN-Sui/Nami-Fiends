export const MEMBERSHIP_TIER_LABELS = [
  'NPC',
  'Adventurer',
  'Pro',
  'Elite'
] as const;

export type MembershipTierLabel = (typeof MEMBERSHIP_TIER_LABELS)[number];

export const REPUTATION_LABELS = [
  'Newbie',
  'Gamester',
  'Goblin',
  'Goonie',
  'Fiend'
] as const;

export type ReputationLabel = (typeof REPUTATION_LABELS)[number];

export function membershipTierLabel(tier: number): MembershipTierLabel {
  return MEMBERSHIP_TIER_LABELS[tier] ?? 'NPC';
}

export function reputationLabel(reputation: number): ReputationLabel {
  return REPUTATION_LABELS[reputation] ?? 'Newbie';
}

export const CONDUCT_SIGNAL_LABELS = [
  'Unknown',
  'Green',
  'Orange',
  'Red',
  'Black',
] as const;

export type ConductSignalLabel = (typeof CONDUCT_SIGNAL_LABELS)[number];

export function conductSignalLabel(signal: number): ConductSignalLabel {
  return CONDUCT_SIGNAL_LABELS[signal] ?? 'Unknown';
}

export function shortAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) {
    return address;
  }

  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
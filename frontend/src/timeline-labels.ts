import type { TimelineCategory, TimelineEntry } from '@nami/sdk';

const KIND_LABELS: Record<string, string> = {
  passport_created: 'Passport Created',
  identity_verified: 'Identity Verified',
  xp_added: 'XP Earned',
  badge_points_added: 'Badge Points',
  tier_upgraded: 'Tier Upgraded',
  conduct_status_created: 'Conduct Status',
  conduct_signal_updated: 'Conduct Updated',
  passport_downed: 'Passport Downed',
  passport_respawned: 'Passport Respawned',
  black_passport_issued: 'Black Passport',
  title_claimed: 'Title Claimed',
  title_display_created: 'Title Display',
  title_equipped: 'Title Equipped',
  cosmetic_unlocked: 'Cosmetic Unlocked',
  cosmetic_loadout_created: 'Loadout Created',
  cosmetic_equipped: 'Cosmetic Equipped',
};

const CATEGORY_LABELS: Record<TimelineCategory, string> = {
  origin: 'Origin',
  progression: 'Progression',
  verification: 'Verification',
  conduct: 'Conduct',
  customization: 'Customization',
  moderation: 'Moderation',
};

export function timelineKindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind.replaceAll('_', ' ');
}

export function timelineCategoryLabel(category: TimelineCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

function formatTimestamp(timestampMs: string | null): string {
  if (!timestampMs) {
    return 'Indexed event';
  }

  const value = Number(timestampMs);

  if (!Number.isFinite(value)) {
    return 'Indexed event';
  }

  return new Date(value).toLocaleString();
}

export function timelineEntrySummary(entry: TimelineEntry): string {
  const payload = entry.payload;

  switch (entry.kind) {
    case 'xp_added':
      return `+${String(payload.amount ?? 0)} XP · total ${String(payload.total_xp ?? 0)}`;
    case 'badge_points_added':
      return `+${String(payload.amount ?? 0)} badge points · rep ${String(payload.reputation ?? 0)}`;
    case 'tier_upgraded':
      return `Tier ${String(payload.old_tier ?? '?')} → ${String(payload.new_tier ?? '?')}`;
    case 'conduct_signal_updated':
      return `Signal ${String(payload.old_signal ?? '?')} → ${String(payload.new_signal ?? '?')}`;
    case 'title_equipped':
      return `Equipped title type ${String(payload.title_type ?? '?')}`;
    case 'cosmetic_equipped':
      return `Equipped cosmetic ${String(payload.cosmetic_type ?? '?')}:${String(payload.cosmetic_code ?? '?')}`;
    case 'identity_verified':
      return `Verification level ${String(payload.verification_level ?? '?')}`;
    case 'passport_created':
      return `Linked identity ${String(payload.identity_id ?? '').slice(0, 10)}…`;
    default:
      return entry.tx_digest ? `Tx ${entry.tx_digest.slice(0, 10)}…` : 'Protocol event';
  }
}

export function formatTimelineTimestamp(entry: TimelineEntry): string {
  return formatTimestamp(entry.timestamp_ms);
}
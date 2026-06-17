import { readOfficialOwner } from './protocol-env.js';

export type NamiAdminRole = 'none' | 'official-owner' | 'official-moderator';

const MODERATORS_KEY = 'nami.admin.moderators';

export type NamiOwnerCapability =
  | 'core-settings'
  | 'official-panels'
  | 'server-maintenance'
  | 'nodename-claims'
  | 'ban-enforcement'
  | 'jury-control'
  | 'moderator-management';

const OWNER_ONLY_CAPABILITIES: ReadonlySet<NamiOwnerCapability> = new Set([
  'core-settings',
  'official-panels',
  'server-maintenance',
  'nodename-claims',
  'ban-enforcement',
  'jury-control',
  'moderator-management',
]);

function readJsonArray<T>(key: string): T[] {
  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function readOfficialModerators(): string[] {
  return readJsonArray<string>(MODERATORS_KEY).filter((entry) => typeof entry === 'string');
}

export function writeOfficialModerators(addresses: string[], actorOwner: string | null): boolean {
  if (!isOfficialOwner(actorOwner)) {
    return false;
  }

  window.localStorage.setItem(
    MODERATORS_KEY,
    JSON.stringify(addresses.filter((entry) => entry.startsWith('0x')))
  );

  window.dispatchEvent(new CustomEvent('nami-admin-changed'));
  return true;
}

export function resolveNamiAdminRole(connectedOwner: string | null): NamiAdminRole {
  const officialOwner = readOfficialOwner();

  if (!connectedOwner || !officialOwner) {
    return 'none';
  }

  if (connectedOwner.toLowerCase() === officialOwner.toLowerCase()) {
    return 'official-owner';
  }

  if (
    readOfficialModerators().some((entry) => entry.toLowerCase() === connectedOwner.toLowerCase())
  ) {
    return 'official-moderator';
  }

  return 'none';
}

export function isOfficialOwner(connectedOwner: string | null): boolean {
  return resolveNamiAdminRole(connectedOwner) === 'official-owner';
}

export function hasOwnerCapability(
  connectedOwner: string | null,
  capability: NamiOwnerCapability
): boolean {
  if (!OWNER_ONLY_CAPABILITIES.has(capability)) {
    return false;
  }

  return isOfficialOwner(connectedOwner);
}

export function canManageCoreSettings(connectedOwner: string | null): boolean {
  return hasOwnerCapability(connectedOwner, 'core-settings');
}

export function canManageOfficialPanels(connectedOwner: string | null): boolean {
  return hasOwnerCapability(connectedOwner, 'official-panels');
}

export function canManageServerMaintenance(connectedOwner: string | null): boolean {
  return hasOwnerCapability(connectedOwner, 'server-maintenance');
}

export function canReviewNodenameClaims(connectedOwner: string | null): boolean {
  return hasOwnerCapability(connectedOwner, 'nodename-claims');
}

export function canBanMembers(connectedOwner: string | null): boolean {
  return hasOwnerCapability(connectedOwner, 'ban-enforcement');
}

export function canControlJury(connectedOwner: string | null): boolean {
  return hasOwnerCapability(connectedOwner, 'jury-control');
}

export function canManageModerators(connectedOwner: string | null): boolean {
  return hasOwnerCapability(connectedOwner, 'moderator-management');
}

export const OWNER_CAPABILITY_LABELS: Record<NamiOwnerCapability, string> = {
  'core-settings': 'Change Nami core settings',
  'official-panels': 'Update Official Nami panels',
  'server-maintenance': 'Start or shut down maintenance servers',
  'nodename-claims': 'Accept nodename submissions',
  'ban-enforcement': 'Ban or lift enforcement actions',
  'jury-control': 'Open or close jury cases',
  'moderator-management': 'Promote or demote official moderators',
};
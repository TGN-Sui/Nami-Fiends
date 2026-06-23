/** Shared protocol environment readers — single source for wallet + indexer wiring. */

const PLACEHOLDER_OWNER_VALUES = new Set([
  '0xYOUR_OFFICIAL_OWNER',
  '0xYOUR_WALLET_ADDRESS_HERE',
  '0xYOUR_DEMO_OWNER',
]);

export function isPlaceholderProtocolOwner(value: string | null | undefined): boolean {
  if (typeof value !== 'string') {
    return true;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith('0x') || trimmed === '0x') {
    return true;
  }

  if (PLACEHOLDER_OWNER_VALUES.has(trimmed)) {
    return true;
  }

  return trimmed.includes('YOUR_');
}

function readConfiguredOwnerAddress(name: 'VITE_NAMI_OFFICIAL_OWNER' | 'VITE_NAMI_DEMO_OWNER'): string | null {
  const value = import.meta.env[name];

  if (isPlaceholderProtocolOwner(value)) {
    return null;
  }

  return value.trim();
}

export function readOfficialOwnerEmail(): string | null {
  const value = import.meta.env.VITE_NAMI_OFFICIAL_OWNER_EMAIL;

  if (typeof value !== 'string' || value.trim() === '' || !value.includes('@')) {
    return null;
  }

  return value.trim().toLowerCase();
}

export function readOfficialOwner(): string | null {
  return readConfiguredOwnerAddress('VITE_NAMI_OFFICIAL_OWNER') ?? readConfiguredOwnerAddress('VITE_NAMI_DEMO_OWNER');
}

export function readAdminCapId(): string | null {
  const value = import.meta.env.VITE_NAMI_ADMIN_CAP_ID;

  if (typeof value !== 'string' || !value.startsWith('0x') || value.trim() === '') {
    return null;
  }

  return value.trim();
}

export function readNodenameRegistryId(): string | null {
  const value = import.meta.env.VITE_NAMI_NODENAME_REGISTRY_ID;

  if (typeof value !== 'string' || !value.startsWith('0x') || value.trim() === '') {
    return null;
  }

  return value.trim();
}

export function readDemoOwner(): string | null {
  return readConfiguredOwnerAddress('VITE_NAMI_DEMO_OWNER');
}

export function readIndexerUrl(): string | null {
  const value = import.meta.env.VITE_NAMI_INDEXER_URL;

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  return value.trim().replace(/\/$/, '');
}

export function isValidProtocolOwner(owner: string | null | undefined): owner is string {
  return typeof owner === 'string' && owner.startsWith('0x');
}

export function readWalletAuthRequired(): boolean {
  const value = import.meta.env.VITE_NAMI_REQUIRE_WALLET_AUTH;

  if (value === undefined || value === '') {
    return false;
  }

  return value.toLowerCase() === 'true' || value === '1';
}
/** Shared protocol environment readers — single source for wallet + indexer wiring. */

export function readDemoOwner(): string | null {
  const value = import.meta.env.VITE_NAMI_DEMO_OWNER;

  if (typeof value !== 'string' || !value.startsWith('0x') || value.trim() === '') {
    return null;
  }

  return value.trim();
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
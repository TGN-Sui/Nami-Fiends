import {
  createNamiClient,
  type NamiClient,
  type NamiNetwork
} from '@nami/sdk';

function readNetwork(): NamiNetwork {
  const value = import.meta.env.VITE_NAMI_NETWORK ?? 'testnet';

  if (
    value === 'devnet' ||
    value === 'testnet' ||
    value === 'mainnet' ||
    value === 'localnet'
  ) {
    return value;
  }

  return 'testnet';
}

export function hasConfiguredPackageId(): boolean {
  const packageId = import.meta.env.VITE_NAMI_PACKAGE_ID;

  return (
    typeof packageId === 'string' &&
    packageId.trim() !== '' &&
    packageId.startsWith('0x') &&
    packageId !== '0xYOUR_PACKAGE_ID_HERE'
  );
}

export function getConfiguredPackageId(): string {
  return import.meta.env.VITE_NAMI_PACKAGE_ID ?? '';
}

export function getConfiguredNetwork(): NamiNetwork {
  return readNetwork();
}

export function createConfiguredNamiClient(): NamiClient | null {
  if (!hasConfiguredPackageId()) {
    return null;
  }

  return createNamiClient({
    network: readNetwork(),
    packageId: getConfiguredPackageId(),
    fullnodeUrl: import.meta.env.VITE_SUI_FULLNODE_URL
  });
}
import { getConfiguredNetwork, getConfiguredPackageId } from './nami.js';
import {
  readAdminCapId,
  readDemoOwner,
  readIndexerUrl,
  readOfficialOwner,
  readWalletAuthRequired,
} from './protocol-env.js';

export type AppConfig = {
  network: string;
  packageId: string | null;
  indexerUrl: string | null;
  officialOwner: string | null;
  demoOwner: string | null;
  adminCapId: string | null;
  requireWalletAuth: boolean;
  testLaunch: boolean;
  devFixtures: boolean;
};

function readBooleanEnv(name: string, defaultValue = false): boolean {
  const value = import.meta.env[name];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

let cachedConfig: AppConfig | null = null;

export function readAppConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const packageId = getConfiguredPackageId();
  const indexerUrl = readIndexerUrl();
  const testLaunch = readBooleanEnv('VITE_NAMI_TEST_LAUNCH');
  const devFixturesRequested = readBooleanEnv('VITE_NAMI_DEV_FIXTURES', true);

  cachedConfig = {
    network: getConfiguredNetwork(),
    packageId: packageId && packageId !== '0xYOUR_PACKAGE_ID_HERE' ? packageId : null,
    indexerUrl,
    officialOwner: readOfficialOwner(),
    demoOwner: readDemoOwner(),
    adminCapId: readAdminCapId(),
    requireWalletAuth: readWalletAuthRequired(),
    testLaunch,
    devFixtures: testLaunch ? false : devFixturesRequested,
  };

  return cachedConfig;
}

export function isIndexerLive(config: AppConfig = readAppConfig()): boolean {
  return config.indexerUrl !== null;
}

export function isChainConfigured(config: AppConfig = readAppConfig()): boolean {
  return config.packageId !== null;
}

/**
 * Dev fixture catalogs (channels, members, chat seeds).
 * Disable with VITE_NAMI_DEV_FIXTURES=false.
 *
 * Indexer URL configuration alone does not switch catalogs off — live directory
 * providers take over in Slice 7 once the receiving server is connected.
 */
export function shouldUseDevFixtures(config: AppConfig = readAppConfig()): boolean {
  return config.devFixtures && !config.testLaunch;
}

/** Demo perspectives, simulate buttons, and mock provider affordances (never on official testnet). */
export function isDemoSimulationEnabled(config: AppConfig = readAppConfig()): boolean {
  return shouldUseDevFixtures(config);
}

/** Demo wallet claim path and preview owner fallback (never on official testnet). */
export function isDemoWalletOnboardingEnabled(config: AppConfig = readAppConfig()): boolean {
  return isDemoSimulationEnabled(config);
}

/** Fallback protocol owner when no wallet/zkLogin is connected (dev only). */
export function shouldUseDemoOwnerFallback(config: AppConfig = readAppConfig()): boolean {
  return shouldUseDevFixtures(config) && config.demoOwner !== null;
}

export function isTestLaunchMode(config: AppConfig = readAppConfig()): boolean {
  return config.testLaunch;
}

/** Auto-populate local message/event/chat stores on first load (dev demo only). */
export function shouldAutoSeedLocalData(config: AppConfig = readAppConfig()): boolean {
  if (isTestLaunchMode(config)) {
    return false;
  }

  return shouldUseDevFixtures(config);
}

/** Functional mock catalog is disabled — discovery uses real created accounts/channels. */
export function shouldUseFunctionalMockCatalog(_config: AppConfig = readAppConfig()): boolean {
  return false;
}

/** Keep fixture catalogs visible while polishing even if live discovery returns no rows yet. */
export function shouldUseFixtureCatalogFallback(
  liveItemCount: number,
  _loadState: 'idle' | 'loading' | 'ready' | 'error',
  config: AppConfig = readAppConfig()
): boolean {
  if (liveItemCount > 0) {
    return false;
  }

  return shouldUseDevFixtures(config) || shouldUseFunctionalMockCatalog(config);
}

/** Local mock checkout and provider simulation (dev only, never in test launch). */
export function isMockMembershipCheckoutEnabled(config: AppConfig = readAppConfig()): boolean {
  return shouldUseDevFixtures(config) && !isTestLaunchMode(config);
}

/** Official owner can preview dashboard perspectives during test launch. */
export function canUseDashboardPerspectives(
  connectedOwner: string | null,
  config: AppConfig = readAppConfig()
): boolean {
  if (isDemoSimulationEnabled(config)) {
    return true;
  }

  const officialOwner = config.officialOwner;

  if (!connectedOwner || !officialOwner) {
    return false;
  }

  return connectedOwner.toLowerCase() === officialOwner.toLowerCase();
}
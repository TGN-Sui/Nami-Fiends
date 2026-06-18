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

  cachedConfig = {
    network: getConfiguredNetwork(),
    packageId: packageId && packageId !== '0xYOUR_PACKAGE_ID_HERE' ? packageId : null,
    indexerUrl,
    officialOwner: readOfficialOwner(),
    demoOwner: readDemoOwner(),
    adminCapId: readAdminCapId(),
    requireWalletAuth: readWalletAuthRequired(),
    testLaunch: readBooleanEnv('VITE_NAMI_TEST_LAUNCH'),
    devFixtures: readBooleanEnv('VITE_NAMI_DEV_FIXTURES', true),
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
  return config.devFixtures;
}

export function isTestLaunchMode(config: AppConfig = readAppConfig()): boolean {
  return config.testLaunch;
}
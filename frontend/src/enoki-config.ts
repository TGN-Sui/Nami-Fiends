import { isTestLaunchMode, readAppConfig } from './app-config.js';

export type EnokiEnvConfig = {
  apiKey: string | null;
  portalUrl: string | null;
  enabled: boolean;
  testLaunch: boolean;
};

function readOptionalEnv(name: string): string | null {
  const value = import.meta.env[name];

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  return value.trim();
}

/** Mysten Enoki — sponsored transactions + Connect for frictionless zkLogin UX. */
export function readEnokiEnvConfig(): EnokiEnvConfig {
  const apiKey = readOptionalEnv('VITE_ENOKI_API_KEY');
  const portalUrl = readOptionalEnv('VITE_ENOKI_PORTAL_URL');

  return {
    apiKey,
    portalUrl,
    enabled: apiKey !== null,
    testLaunch: isTestLaunchMode(readAppConfig()),
  };
}

export function isEnokiSigningPreferred(): boolean {
  return readEnokiEnvConfig().enabled;
}
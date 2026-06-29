import fs from 'node:fs';
import path from 'node:path';

import { config } from '../config.js';

export type WalrusSiteProjection = {
  site_object_id: string | null;
  network: string | null;
  storage_epochs: number | string | null;
  last_deploy_ms: number | null;
  portal_note: string | null;
  dist_path?: string | null;
};

export type LaunchOpsWalrusSitesReadiness = {
  configured: boolean;
  site_object_id: string | null;
  network: string | null;
  storage_epochs: number | string | null;
  last_deploy_ms: number | null;
  portal_note: string;
  ws_resources_present: boolean;
};

const DEFAULT_PORTAL_NOTE =
  'Walrus Sites SPA not deployed yet. Run node scripts/deploy-walrus-sites.mjs after site-builder setup.';

function resolveDataDir(): string {
  const fromEnv = (process.env.NAMI_DATA_DIR ?? '').trim().replace(/\/$/, '');

  return fromEnv || config.dataDir;
}

function projectionFilePath(): string {
  return path.join(resolveDataDir(), 'projections', 'walrus-site.json');
}

function wsResourcesSourcePath(): string {
  return path.resolve(config.dataDir, '..', '..', 'frontend', 'ws-resources.json');
}

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function readWalrusSiteProjection(): WalrusSiteProjection | null {
  const fromFile = readJsonFile<WalrusSiteProjection>(projectionFilePath());

  if (fromFile) {
    return fromFile;
  }

  const envObjectId = (process.env.NAMI_WALRUS_SITE_OBJECT_ID ?? '').trim();

  if (!envObjectId) {
    return null;
  }

  return {
    site_object_id: envObjectId,
    network: process.env.NAMI_WALRUS_SITE_NETWORK ?? config.network,
    storage_epochs: process.env.NAMI_WALRUS_SITE_EPOCHS ?? null,
    last_deploy_ms: null,
    portal_note: null,
  };
}

export function readWsResourcesObjectId(): string | null {
  const wsResources = readJsonFile<{ object_id?: string }>(wsResourcesSourcePath());
  const objectId = wsResources?.object_id?.trim();

  return objectId ? objectId : null;
}

export function buildWalrusSitesReadiness(): LaunchOpsWalrusSitesReadiness {
  const projection = readWalrusSiteProjection();
  const wsObjectId = readWsResourcesObjectId();
  const envObjectId = (process.env.NAMI_WALRUS_SITE_OBJECT_ID ?? '').trim();
  const siteObjectId =
    projection?.site_object_id ?? (envObjectId || wsObjectId || null);
  const wsResourcesPresent = fs.existsSync(wsResourcesSourcePath());

  return {
    configured: Boolean(siteObjectId),
    site_object_id: siteObjectId,
    network: projection?.network ?? config.network,
    storage_epochs: projection?.storage_epochs ?? null,
    last_deploy_ms: projection?.last_deploy_ms ?? null,
    portal_note: projection?.portal_note ?? DEFAULT_PORTAL_NOTE,
    ws_resources_present: wsResourcesPresent,
  };
}
import {
  alignZkLoginRedirectWithPageOrigin,
  readZkLoginEnvConfig,
  validateZkLoginEnv,
  type ZkLoginValidationIssue,
} from './zklogin-config.js';

export type PortalZkLoginCutoverSnapshot = {
  pageOrigin: string | null;
  configuredRedirectUrl: string;
  redirectAligned: boolean;
  walrusPortalUrl: string | null;
  zkLoginConfigured: boolean;
  issues: ZkLoginValidationIssue[];
  cutoverSteps: string[];
};

function normalizePortalUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export function readWalrusPortalUrlFromEnv(): string | null {
  const raw = import.meta.env.VITE_NAMI_WALRUS_PORTAL_URL;

  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }

  return normalizePortalUrl(raw);
}

function pageOriginFromHref(href: string): string | null {
  try {
    const url = new URL(href);

    return normalizePortalUrl(`${url.origin}/`);
  } catch {
    return null;
  }
}

export function assessPortalZkLoginCutover(pageHref?: string): PortalZkLoginCutoverSnapshot {
  const zkConfig = readZkLoginEnvConfig();
  const resolvedHref =
    pageHref ?? (typeof window !== 'undefined' ? window.location.href : '');
  const pageOrigin = resolvedHref ? pageOriginFromHref(resolvedHref) : null;

  const configuredRedirectUrl = normalizePortalUrl(
    resolvedHref
      ? alignZkLoginRedirectWithPageOrigin(zkConfig.redirectUrl, resolvedHref)
      : zkConfig.redirectUrl
  );
  const redirectAligned =
    pageOrigin !== null ? pageOrigin.toLowerCase() === configuredRedirectUrl.toLowerCase() : true;

  const walrusPortalUrl = readWalrusPortalUrlFromEnv();
  const issues = validateZkLoginEnv(zkConfig);

  if (walrusPortalUrl && pageOrigin && walrusPortalUrl.toLowerCase() !== pageOrigin.toLowerCase()) {
    issues.push({
      code: 'portal_origin_mismatch',
      message:
        'This build was opened on a different origin than VITE_NAMI_WALRUS_PORTAL_URL. Rebuild with the portal redirect or browse from the Walrus portal URL.',
    });
  }

  if (!redirectAligned && pageOrigin) {
    issues.push({
      code: 'redirect_origin_mismatch',
      message:
        'VITE_ZKLOGIN_REDIRECT_URL does not match the current page origin. Google OAuth will fail or split zkLogin sessions.',
    });
  }

  const cutoverSteps = [
    'Deploy the SPA to Walrus Sites (node scripts/deploy-walrus-sites.mjs).',
    'Start a testnet portal (scripts/start-walrus-portal.ps1) or host mysten/walrus-sites-server-portal.',
    'Register the portal JavaScript origin and redirect URI in Google OAuth (trailing slash required).',
    'Rebuild with node scripts/sync-testnet-env.mjs --zklogin-origin <portal-url>/',
    'Redeploy the Walrus Sites bundle and verify zkLogin sign-in on the portal origin.',
  ];

  return {
    pageOrigin,
    configuredRedirectUrl,
    redirectAligned,
    walrusPortalUrl,
    zkLoginConfigured: zkConfig.configured,
    issues,
    cutoverSteps,
  };
}
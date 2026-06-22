import { isTestLaunchMode, readAppConfig } from './app-config.js';

export interface ZkLoginEnvConfig {
  clientId: string | null;
  redirectUrl: string;
  saltUrl: string;
  configured: boolean;
  testLaunch: boolean;
}

export interface ZkLoginValidationIssue {
  code: string;
  message: string;
}

const PLACEHOLDER_PATTERNS = [
  'YOUR_',
  'your-',
  'example.com',
  'placeholder',
];

export function isPlaceholderZkLoginValue(value: string | null | undefined): boolean {
  if (!value || value.trim() === '') {
    return true;
  }

  const normalized = value.trim().toLowerCase();

  return PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function normalizeZkLoginRedirectUrl(originOrUrl: string): string {
  const trimmed = originOrUrl.trim();

  if (trimmed === '') {
    return 'http://localhost:5173/';
  }

  if (trimmed.endsWith('/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    return `${parsed.origin}${parsed.pathname.endsWith('/') ? parsed.pathname : parsed.pathname + '/'}`;
  } catch {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  }
}

export function readZkLoginEnvConfig(): ZkLoginEnvConfig {
  const clientIdRaw = import.meta.env.VITE_ZKLOGIN_CLIENT_ID;
  const redirectRaw = import.meta.env.VITE_ZKLOGIN_REDIRECT_URL;
  const saltRaw = import.meta.env.VITE_ZKLOGIN_SALT_URL;

  const clientId =
    typeof clientIdRaw === 'string' && clientIdRaw.trim() !== '' && !isPlaceholderZkLoginValue(clientIdRaw)
      ? clientIdRaw.trim()
      : null;

  let redirectUrl = 'http://localhost:5173/';

  if (typeof redirectRaw === 'string' && redirectRaw.trim() !== '' && !isPlaceholderZkLoginValue(redirectRaw)) {
    redirectUrl = normalizeZkLoginRedirectUrl(redirectRaw);
  } else if (typeof window !== 'undefined') {
    redirectUrl = normalizeZkLoginRedirectUrl(`${window.location.origin}/`);
  }

  const saltUrl =
    typeof saltRaw === 'string' && saltRaw.trim() !== ''
      ? saltRaw.trim().replace(/\/$/, '')
      : 'https://salt.api.mystenlabs.com/get_salt';

  return {
    clientId,
    redirectUrl,
    saltUrl,
    configured: clientId !== null,
    testLaunch: isTestLaunchMode(readAppConfig()),
  };
}

export function validateZkLoginEnv(config: ZkLoginEnvConfig = readZkLoginEnvConfig()): ZkLoginValidationIssue[] {
  const issues: ZkLoginValidationIssue[] = [];

  if (!config.clientId) {
    issues.push({
      code: 'missing_client_id',
      message: 'Set VITE_ZKLOGIN_CLIENT_ID to a registered Google OAuth client ID.',
    });
  }

  if (isPlaceholderZkLoginValue(config.redirectUrl)) {
    issues.push({
      code: 'missing_redirect_url',
      message: 'Set VITE_ZKLOGIN_REDIRECT_URL to the exact OAuth redirect URI (with trailing slash).',
    });
  }

  try {
    const redirect = new URL(config.redirectUrl);

    if (redirect.protocol !== 'http:' && redirect.protocol !== 'https:') {
      issues.push({
        code: 'invalid_redirect_protocol',
        message: 'zkLogin redirect URL must use http or https.',
      });
    }

    if (!config.redirectUrl.endsWith('/')) {
      issues.push({
        code: 'redirect_missing_trailing_slash',
        message: 'VITE_ZKLOGIN_REDIRECT_URL should end with / to match Google OAuth registration.',
      });
    }
  } catch {
    issues.push({
      code: 'invalid_redirect_url',
      message: 'VITE_ZKLOGIN_REDIRECT_URL is not a valid URL.',
    });
  }

  if (isPlaceholderZkLoginValue(config.saltUrl)) {
    issues.push({
      code: 'missing_salt_url',
      message: 'Set VITE_ZKLOGIN_SALT_URL (default Mysten salt service is fine for testnet).',
    });
  }

  if (config.testLaunch && !config.configured) {
    issues.push({
      code: 'test_launch_requires_zklogin',
      message: 'Official test launch builds require a configured zkLogin client and redirect URI.',
    });
  }

  return issues;
}

export function isZkLoginProductionReady(config: ZkLoginEnvConfig = readZkLoginEnvConfig()): boolean {
  return validateZkLoginEnv(config).length === 0;
}
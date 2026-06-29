import { describe, expect, it, vi } from 'vitest';

vi.mock('./app-config.js', () => ({
  isTestLaunchMode: () => true,
  readAppConfig: () => ({ testLaunch: true }),
}));

describe('portal-zklogin-cutover', () => {
  it('flags redirect mismatch against the current page origin', async () => {
    vi.stubEnv('VITE_ZKLOGIN_REDIRECT_URL', 'https://portal.example/');
    vi.resetModules();

    const { assessPortalZkLoginCutover } = await import('./portal-zklogin-cutover.js');

    const snapshot = assessPortalZkLoginCutover('http://localhost:5173/settings');

    expect(snapshot.pageOrigin).toBe('http://localhost:5173/');
    expect(snapshot.issues.some((issue) => issue.code === 'redirect_origin_mismatch')).toBe(true);

    vi.unstubAllEnvs();
  });

  it('reads Walrus portal URL from env when set', async () => {
    vi.stubEnv('VITE_NAMI_WALRUS_PORTAL_URL', 'https://portal.example');

    const { assessPortalZkLoginCutover, readWalrusPortalUrlFromEnv } = await import(
      './portal-zklogin-cutover.js'
    );

    expect(readWalrusPortalUrlFromEnv()).toBe('https://portal.example/');

    const snapshot = assessPortalZkLoginCutover('https://nami-fiends.vercel.app/');

    expect(snapshot.walrusPortalUrl).toBe('https://portal.example/');
    expect(snapshot.issues.some((issue) => issue.code === 'portal_origin_mismatch')).toBe(true);

    vi.unstubAllEnvs();
  });
});
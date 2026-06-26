import { describe, expect, it } from 'vitest';

import {
  alignZkLoginRedirectWithPageOrigin,
  isPlaceholderZkLoginValue,
  normalizeZkLoginRedirectUrl,
  validateZkLoginEnv,
  type ZkLoginEnvConfig,
} from './zklogin-config.js';

describe('zklogin-config', () => {
  it('detects placeholder OAuth values', () => {
    expect(isPlaceholderZkLoginValue('')).toBe(true);
    expect(isPlaceholderZkLoginValue('https://your-testnet-origin/')).toBe(true);
    expect(
      isPlaceholderZkLoginValue('885352607900-cnbkebbo23ejlbabgvooshre535204qs.apps.googleusercontent.com')
    ).toBe(false);
  });

  it('normalizes redirect URLs with trailing slash', () => {
    expect(normalizeZkLoginRedirectUrl('https://app.example.com')).toBe('https://app.example.com/');
    expect(normalizeZkLoginRedirectUrl('https://app.example.com/')).toBe('https://app.example.com/');
  });

  it('aligns http redirect env with an https page origin', () => {
    expect(
      alignZkLoginRedirectWithPageOrigin(
        'http://nami-fiends.vercel.app/',
        'https://nami-fiends.vercel.app/settings'
      )
    ).toBe('https://nami-fiends.vercel.app/');
  });

  it('flags http redirect URIs on public hosts', () => {
    const issues = validateZkLoginEnv({
      clientId: '885352607900-cnbkebbo23ejlbabgvooshre535204qs.apps.googleusercontent.com',
      redirectUrl: 'http://nami-fiends.vercel.app/',
      saltUrl: 'https://salt.api.mystenlabs.com/get_salt',
      configured: true,
      testLaunch: true,
    });

    expect(issues.some((issue) => issue.code === 'redirect_http_on_public_origin')).toBe(true);
  });

  it('flags missing client ID on test launch', () => {
    const issues = validateZkLoginEnv({
      clientId: null,
      redirectUrl: 'https://app.example.com/',
      saltUrl: 'https://salt.api.mystenlabs.com/get_salt',
      configured: false,
      testLaunch: true,
    });

    expect(issues.some((issue) => issue.code === 'missing_client_id')).toBe(true);
    expect(issues.some((issue) => issue.code === 'test_launch_requires_zklogin')).toBe(true);
  });

  it('accepts a complete production config', () => {
    const config: ZkLoginEnvConfig = {
      clientId: '885352607900-cnbkebbo23ejlbabgvooshre535204qs.apps.googleusercontent.com',
      redirectUrl: 'https://play.nami.chat/',
      saltUrl: 'https://salt.api.mystenlabs.com/get_salt',
      configured: true,
      testLaunch: true,
    };

    expect(validateZkLoginEnv(config)).toEqual([]);
  });
});
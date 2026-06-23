import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./app-config.js', () => ({
  isTestLaunchMode: () => true,
}));

const hasActiveMemberSession = vi.fn(() => false);

vi.mock('./member-session-store.js', () => ({
  hasActiveMemberSession: () => hasActiveMemberSession(),
}));

describe('test-launch-tester-access', () => {
  afterEach(() => {
    vi.resetModules();
    hasActiveMemberSession.mockReset();
  });

  it('grants elite preview only when test launch and signed in', async () => {
    const { hasTestLaunchTesterEliteAccess } = await import('./test-launch-tester-access.js');

    hasActiveMemberSession.mockReturnValue(false);
    expect(hasTestLaunchTesterEliteAccess()).toBe(false);

    hasActiveMemberSession.mockReturnValue(true);
    expect(hasTestLaunchTesterEliteAccess()).toBe(true);
  });
});
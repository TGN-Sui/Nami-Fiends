import { describe, expect, it, vi } from 'vitest';

import {
  canMockStreamGifts,
  canPreviewMockStreamGifts,
  mockStreamGiftSenders,
} from './gift-mock-preview.js';

vi.mock('./nami-capabilities.js', () => ({
  isOfficialOwner: (owner: string | null) =>
    owner?.toLowerCase() === '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca',
}));

vi.mock('./app-config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./app-config.js')>();

  return {
    ...actual,
    isLocalDevEnvironment: () => true,
    isMockMembershipCheckoutEnabled: () => false,
    readAppConfig: () => ({
      ...actual.readAppConfig(),
      devFixtures: true,
      testLaunch: true,
    }),
  };
});

describe('gift-mock-preview', () => {
  it('enables mock stream gifts in local dev builds', () => {
    expect(canMockStreamGifts()).toBe(true);
  });

  it('keeps owner catalog preview gated to the official owner', () => {
    expect(canPreviewMockStreamGifts('0xnotowner')).toBe(false);
    expect(
      canPreviewMockStreamGifts('0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca')
    ).toBe(true);
  });

  it('lists other members as mock gift senders', () => {
    const senders = mockStreamGiftSenders('m2');

    expect(senders.some((member) => member.id === 'm1')).toBe(false);
    expect(senders.some((member) => member.id === 'm2')).toBe(false);
    expect(senders.length).toBeGreaterThan(0);
  });
});
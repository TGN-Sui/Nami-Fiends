import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isPreApprovedGameOwnerWorkspace,
  preApprovedOwnerCapabilityAllowed,
} from './game-owner-approval-guards.js';

vi.mock('./channel-owner-access.js', () => ({
  ownsGameChannel: (channelId: string) => channelId === 'pending-game-vortex',
}));

vi.mock('./game-owner-session-store.js', () => ({
  isPreApprovedGameOwner: () => true,
  isFullyApprovedGameOwner: () => false,
  readGameOwnerSession: () => ({
    provisionalChannelId: 'pending-game-vortex',
  }),
}));

describe('game-owner-approval-guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects pre-approved workspace for the provisional channel', () => {
    expect(isPreApprovedGameOwnerWorkspace('pending-game-vortex')).toBe(true);
    expect(isPreApprovedGameOwnerWorkspace('other-channel')).toBe(false);
  });

  it('allows hidden event prep and banner cover uploads only', () => {
    expect(
      preApprovedOwnerCapabilityAllowed('create-hidden-events', 'pending-game-vortex'),
    ).toBe(true);
    expect(
      preApprovedOwnerCapabilityAllowed('upload-banner-covers', 'pending-game-vortex'),
    ).toBe(true);
    expect(
      preApprovedOwnerCapabilityAllowed('purchase-promotions', 'pending-game-vortex'),
    ).toBe(false);
    expect(
      preApprovedOwnerCapabilityAllowed('submit-partner-ticket', 'pending-game-vortex'),
    ).toBe(false);
    expect(
      preApprovedOwnerCapabilityAllowed('upload-channel-emojis', 'pending-game-vortex'),
    ).toBe(false);
  });
});
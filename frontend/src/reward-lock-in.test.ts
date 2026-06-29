import { describe, expect, it } from 'vitest';

import {
  buildRewardEscrowPlaintext,
  parseRewardEscrowPlaintext,
  rewardLockInHeadline,
} from './reward-lock-in.js';

describe('reward-lock-in', () => {
  it('builds a sealed reward escrow payload', () => {
    const plaintext = buildRewardEscrowPlaintext({
      owner: '0xowner',
      reward: {
        id: 'overlay-genesis',
        name: 'Genesis Spark',
        condition: { type: 'official-grant', memberIds: ['m1'] },
      },
    });

    const parsed = parseRewardEscrowPlaintext(plaintext);

    expect(parsed?.rewardId).toBe('overlay-genesis');
    expect(parsed?.owner).toBe('0xowner');
    expect(parsed?.condition.type).toBe('official-grant');
    expect(parsed?.transferable).toBe(true);
  });

  it('uses gamer-friendly lock-in copy', () => {
    expect(rewardLockInHeadline('Wave Frame')).toBe('Lock in Wave Frame?');
  });
});
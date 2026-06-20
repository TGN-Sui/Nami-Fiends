import { describe, expect, it } from 'vitest';

import {
  buildClaimNodename,
  FIEND_CLAIM_HANDLE_PREFIX,
  nodenameSuffixFromFull,
} from './member-public-chat.js';

describe('nodename claim handles', () => {
  it('builds claim nodenames with the @fiend prefix', () => {
    expect(buildClaimNodename('gamer')).toBe('fiendgamer');
    expect(FIEND_CLAIM_HANDLE_PREFIX).toBe('fiend');
  });

  it('strips the fiend prefix when editing an existing claim', () => {
    expect(nodenameSuffixFromFull('fiendgamer')).toBe('gamer');
    expect(nodenameSuffixFromFull('@fiend_gamer')).toBe('_gamer');
  });

  it('still parses legacy @nami claims for migration', () => {
    expect(nodenameSuffixFromFull('namigamer')).toBe('gamer');
  });
});
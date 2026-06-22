import { describe, expect, it } from 'vitest';

import { isPlaceholderProtocolOwner, readOfficialOwner } from './protocol-env.js';

describe('protocol-env owner readers', () => {
  it('treats scaffold owner addresses as placeholders', () => {
    expect(isPlaceholderProtocolOwner('0xYOUR_OFFICIAL_OWNER')).toBe(true);
    expect(isPlaceholderProtocolOwner('0xYOUR_WALLET_ADDRESS_HERE')).toBe(true);
    expect(isPlaceholderProtocolOwner('')).toBe(true);
    expect(isPlaceholderProtocolOwner('0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca')).toBe(
      false,
    );
  });

  it('reads a configured official owner from env', () => {
    expect(readOfficialOwner()).toBe(
      '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca',
    );
  });
});
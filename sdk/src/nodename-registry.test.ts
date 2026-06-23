import { describe, expect, it } from 'vitest';

import { normalizeNodename } from './nodename-registry.js';

describe('normalizeNodename', () => {
  it('accepts valid fiend handles', () => {
    expect(normalizeNodename('fiendgamer')).toBe('fiendgamer');
    expect(normalizeNodename('@fiendgamer')).toBe('fiendgamer');
    expect(normalizeNodename('  FIENDGAMER  ')).toBe('fiendgamer');
  });

  it('rejects handles outside onboarding rules', () => {
    expect(normalizeNodename('gamer')).toBeNull();
    expect(normalizeNodename('fiend')).toBeNull();
    expect(normalizeNodename('fiend!bad')).toBeNull();
  });
});
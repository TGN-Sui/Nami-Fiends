import { describe, expect, it } from 'vitest';

describe('ChatGiftPicker', () => {
  it('is exported for composer integration', async () => {
    const module = await import('./ChatGiftPicker.js');

    expect(typeof module.ChatGiftPicker).toBe('function');
  });
});
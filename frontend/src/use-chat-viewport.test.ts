import { describe, expect, it } from 'vitest';

import { scrollChatStackToBottom } from './use-chat-viewport.js';

describe('scrollChatStackToBottom', () => {
  it('scrolls the message stack to the latest message', () => {
    const stack = {
      scrollHeight: 480,
      scrollTop: 0,
    } as unknown as HTMLElement;

    scrollChatStackToBottom(stack);

    expect(stack.scrollTop).toBe(480);
  });

  it('ignores null or undefined stacks', () => {
    expect(() => scrollChatStackToBottom(null)).not.toThrow();
    expect(() => scrollChatStackToBottom(undefined)).not.toThrow();
  });
});
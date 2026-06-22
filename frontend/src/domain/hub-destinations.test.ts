import { describe, expect, it } from 'vitest';

import {
  hubDestinationItems,
  hubTriangleSlotForPage,
  isHubDestinationPage,
  resolveHubTriangleAnchor,
} from './hub-destinations.js';

describe('hub-destinations', () => {
  it('exposes hub, game hub, and arcade destinations', () => {
    expect(hubDestinationItems.map((item) => item.page)).toEqual(['hub', 'gamehub', 'arcade']);
  });

  it('recognizes hub destination pages', () => {
    expect(isHubDestinationPage('arcade')).toBe(true);
    expect(isHubDestinationPage('settings')).toBe(false);
  });

  it('keeps the default downward triangle when arcade is active', () => {
    expect(hubTriangleSlotForPage('gamehub', 'arcade')).toBe('top-left');
    expect(hubTriangleSlotForPage('hub', 'arcade')).toBe('top-right');
    expect(hubTriangleSlotForPage('arcade', 'arcade')).toBe('bottom');
  });

  it('rotates the active hub to the triangle bottom', () => {
    expect(hubTriangleSlotForPage('hub', 'hub')).toBe('bottom');
    expect(hubTriangleSlotForPage('gamehub', 'hub')).toBe('top-right');
    expect(hubTriangleSlotForPage('arcade', 'hub')).toBe('top-left');

    expect(hubTriangleSlotForPage('gamehub', 'gamehub')).toBe('bottom');
    expect(hubTriangleSlotForPage('hub', 'gamehub')).toBe('top-left');
    expect(hubTriangleSlotForPage('arcade', 'gamehub')).toBe('top-right');
  });

  it('falls back to the arcade anchor off hub routes', () => {
    expect(resolveHubTriangleAnchor('settings')).toBe('arcade');
  });
});
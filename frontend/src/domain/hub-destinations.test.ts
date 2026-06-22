import { describe, expect, it } from 'vitest';

import { hubDestinationItems, isHubDestinationPage } from './hub-destinations.js';

describe('hub-destinations', () => {
  it('exposes hub, game hub, and arcade destinations', () => {
    expect(hubDestinationItems.map((item) => item.page)).toEqual(['hub', 'gamehub', 'arcade']);
  });

  it('recognizes hub destination pages', () => {
    expect(isHubDestinationPage('arcade')).toBe(true);
    expect(isHubDestinationPage('settings')).toBe(false);
  });
});
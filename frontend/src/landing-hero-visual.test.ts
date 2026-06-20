import { describe, expect, it, vi } from 'vitest';

vi.mock('./uiMockData.js', () => ({
  members: [
    {
      id: 'm1',
      surfaceType: 'member',
      name: 'Traveler',
      avatarSeed: 'NA',
      signal: 'Green',
      tier: 'NPC',
      badge: 'Unset',
    },
  ],
  channels: [],
  developers: [],
  chatMessages: [],
  userProfile: { name: 'Traveler', tier: 'NPC', signal: 'Green', badge: 'Unset' },
}));

describe('landing hero visual', () => {
  it('renders passport collage when fixture catalogs are disabled', async () => {
    const { LandingHeroVisual } = await import('./LandingHeroVisual.js');
    const { renderToStaticMarkup } = await import('react-dom/server');

    const markup = renderToStaticMarkup(LandingHeroVisual());

    expect(markup).toContain('nami-landing-hero-visual');
    expect(markup).toContain('nami-landing-tcg-card-wrap');
  });
});
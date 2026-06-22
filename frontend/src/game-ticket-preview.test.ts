import { describe, expect, it } from 'vitest';

import { buildGameTicketPreviewFields } from './game-ticket-preview.js';

describe('buildGameTicketPreviewFields', () => {
  it('includes only filled contact, social, and store fields', () => {
    const fields = buildGameTicketPreviewFields({
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: 'studio@northarcade.example',
      genres: ['Shooter', 'Indie'],
      platforms: ['PC', 'Mobile'],
      websiteUrl: 'https://northarcade.example',
      trailerUrl: '',
      steamStoreUrl: 'https://store.steampowered.com/app/123',
      epicStoreUrl: '',
      xboxStoreUrl: '',
      playstationStoreUrl: '',
      otherStoreUrl: '',
      officialSocialPlatform: 'x',
      officialSocialHandle: '@vortexarena',
      officialSocialVerified: true,
    });

    expect(fields.map((field) => field.id)).toEqual([
      'studio',
      'contact',
      'email',
      'genres',
      'platforms',
      'official-social',
      'website',
      'steamStoreUrl',
    ]);
  });
});
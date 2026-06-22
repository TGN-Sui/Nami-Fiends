import { describe, expect, it } from 'vitest';

import {
  LANDING_GENRE_LOUNGES,
} from './landing-content.js';
import {
  PROFILE_GENRE_LOUNGE_COUNT,
  PROFILE_GENRE_LOUNGE_OPTIONS,
} from './platform-genre-options.js';

describe('platform-genre-options', () => {
  it('exposes the top 20 genre lounge bubble genres', () => {
    expect(PROFILE_GENRE_LOUNGE_OPTIONS).toHaveLength(PROFILE_GENRE_LOUNGE_COUNT);
    expect(PROFILE_GENRE_LOUNGE_OPTIONS[0]).toBe('Shooter');
    expect(PROFILE_GENRE_LOUNGE_OPTIONS[19]).toBe(LANDING_GENRE_LOUNGES[19]);
    expect(PROFILE_GENRE_LOUNGE_OPTIONS).not.toContain(LANDING_GENRE_LOUNGES[20]);
  });
});
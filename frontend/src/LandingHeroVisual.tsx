import { type CSSProperties, type ReactElement } from 'react';

import { genreOfficialChats } from './global-chats.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import { channels, members } from './uiMockData.js';

const HERO_MEMBER = members[0]!;
const HERO_CHANNEL = channels[0]!;
const HERO_GENRE = genreOfficialChats[0]!;

export function LandingHeroVisual(): ReactElement {
  return (
    <div className="nami-landing-hero-visual" aria-hidden="true">
      <div className="nami-landing-hero-collage">
        <div className="nami-landing-hero-passport-slot is-desktop-passport">
          <TcgFoilPassportCard layout="vertical" member={HERO_MEMBER} />
        </div>

        <article
          className="nami-landing-hero-channel-card"
          style={
            {
              '--game-card-brand': '#ff3152',
              '--game-card-brand-soft': '#75d7ff',
            } as CSSProperties
          }
        >
          <div
            className="nami-landing-hero-channel-art has-game-cover-image"
            style={{ backgroundImage: 'url(' + HERO_CHANNEL.coverImageUrl + ')' }}
          />
          <div className="nami-landing-hero-channel-overlay">
            <span className="mini-badge">Verified channel</span>
            <strong>{HERO_CHANNEL.name}</strong>
            <small>{HERO_CHANNEL.genre}</small>
          </div>
        </article>

        <article className="nami-landing-hero-genre-bubble">
          <span className="nami-landing-hero-genre-orbit" />
          <div className="nami-landing-hero-genre-core">
            <span className="mini-badge">Genre lounge</span>
            <strong>{HERO_GENRE.title}</strong>
            <small>{HERO_GENRE.activeMembers.toLocaleString()} active</small>
          </div>
        </article>
      </div>

      <div className="nami-landing-hero-mobile-pass">
        <TcgFoilPassportCard layout="vertical" member={HERO_MEMBER} />
      </div>
    </div>
  );
}
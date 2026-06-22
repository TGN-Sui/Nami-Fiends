import { type CSSProperties, type ReactElement, type ReactNode } from 'react';

import { shouldUseDevFixtures } from './app-config.js';
import {
  LANDING_HERO_ELITE_MEMBER,
  LANDING_HERO_OFFICIAL_MEMBER,
  LANDING_HERO_PRO_MEMBER,
} from './fixtures/landing-hero-members.js';
import { createShellSelfMember } from './fixtures/shell-catalog.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import type { NamiMember } from './uiMockData.js';

function landingFixtureAvatarUrl(initials: string, accent: string, base: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
    '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
    '<stop offset="0" stop-color="' +
    accent +
    '" stop-opacity=".26"/>' +
    '<stop offset=".46" stop-color="' +
    base +
    '"/>' +
    '<stop offset="1" stop-color="' +
    accent +
    '" stop-opacity=".18"/>' +
    '</linearGradient></defs>' +
    '<rect width="400" height="400" rx="72" fill="' +
    base +
    '"/>' +
    '<path d="M0 270 C74 218 142 322 220 270 C292 222 330 252 400 214 L400 400 L0 400 Z" fill="' +
    accent +
    '" opacity=".18"/>' +
    '<text x="200" y="228" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="118" fill="' +
    accent +
    '" letter-spacing="-10">' +
    initials +
    '</text></svg>';

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function withLandingAvatar(member: NamiMember, initials: string, theme: 'elite' | 'pro'): NamiMember {
  if (member.avatarImageUrl?.trim()) {
    return member;
  }

  const palette =
    theme === 'elite'
      ? { accent: '#ffd36e', base: '#201807' }
      : { accent: '#75d7ff', base: '#071828' };

  return {
    ...member,
    avatarImageUrl: landingFixtureAvatarUrl(initials, palette.accent, palette.base),
  };
}

const ELITE_GLITTER_SPACING_PX = 12;
const ELITE_GLITTER_COUNT = 8;
const ELITE_GLITTER_CYCLE_PX = ELITE_GLITTER_SPACING_PX * ELITE_GLITTER_COUNT;

const eliteGlitterLayout = [
  { left: '11%', width: 2, height: 7, rotate: 24, delay: 0 },
  { left: '78%', width: 3, height: 5, rotate: -38, delay: -0.6 },
  { left: '34%', width: 2, height: 9, rotate: 12, delay: -1.1 },
  { left: '62%', width: 2, height: 6, rotate: -18, delay: -1.8 },
  { left: '48%', width: 3, height: 4, rotate: 42, delay: -2.4 },
  { left: '22%', width: 2, height: 8, rotate: -28, delay: -3.1 },
  { left: '86%', width: 2, height: 6, rotate: 16, delay: -3.8 },
  { left: '56%', width: 2, height: 7, rotate: -44, delay: -4.5 },
] as const;

function LandingTcgPassportWrap(props: { children: ReactNode }): ReactElement {
  return <div className="nami-landing-tcg-card-wrap">{props.children}</div>;
}

function ElitePassportGlitter(): ReactElement {
  return (
    <span
      aria-hidden="true"
      className="nami-landing-elite-glitter-lane member-spotlight-glitter-lane"
      style={
        {
          '--member-spotlight-glitter-cycle': String(ELITE_GLITTER_CYCLE_PX) + 'px',
          '--member-spotlight-glitter-spacing': String(ELITE_GLITTER_SPACING_PX) + 'px',
        } as CSSProperties
      }
    >
      <span className="member-spotlight-glitter-loop">
        {[0, 1].map((passIndex) => (
          <span className="member-spotlight-glitter-pass" key={'landing-elite-glitter-pass-' + passIndex}>
            {eliteGlitterLayout.map((glitter, glitterIndex) => (
              <i
                className="member-spotlight-glitter-shard"
                key={'landing-elite-glitter-' + passIndex + '-' + glitterIndex}
                style={
                  {
                    left: glitter.left,
                    top: String(glitterIndex * ELITE_GLITTER_SPACING_PX) + 'px',
                    width: String(glitter.width) + 'px',
                    height: String(glitter.height) + 'px',
                    '--member-spotlight-glitter-rotate': String(glitter.rotate) + 'deg',
                    '--member-spotlight-glitter-delay': String(glitter.delay) + 's',
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}

function LandingPassportCard(props: { member: NamiMember; withGlitter?: boolean }): ReactElement {
  return (
    <LandingTcgPassportWrap>
      {props.withGlitter ? <ElitePassportGlitter /> : null}
      <TcgFoilPassportCard layout="vertical" member={props.member} />
    </LandingTcgPassportWrap>
  );
}

function landingShellMember(tier: NamiMember['tier'], avatarSeed: string): NamiMember {
  return {
    ...createShellSelfMember(),
    tier,
    avatarSeed,
    name: 'Member',
    badge: 'Unset',
  };
}

export function LandingHeroVisual(): ReactElement {
  const useFixtureHeroes = shouldUseDevFixtures();
  const eliteMember = useFixtureHeroes
    ? withLandingAvatar(LANDING_HERO_ELITE_MEMBER, LANDING_HERO_ELITE_MEMBER.avatarSeed, 'elite')
    : landingShellMember('Elite', 'EL');
  const officialMember = useFixtureHeroes
    ? LANDING_HERO_OFFICIAL_MEMBER
    : landingShellMember('Adventurer', 'NA');
  const proMember = useFixtureHeroes
    ? withLandingAvatar(LANDING_HERO_PRO_MEMBER, LANDING_HERO_PRO_MEMBER.avatarSeed, 'pro')
    : landingShellMember('Pro', 'PR');

  return (
    <div className="nami-landing-hero-visual" aria-hidden="true">
      <div className="nami-landing-hero-collage">
        <div className="nami-landing-hero-elite-passport-slot is-desktop-passport">
          <LandingPassportCard member={eliteMember} withGlitter />
        </div>

        <div className="nami-landing-hero-official-passport-slot is-desktop-passport">
          <LandingPassportCard member={officialMember} />
        </div>

        <div className="nami-landing-hero-pro-passport-slot is-desktop-passport">
          <LandingPassportCard member={proMember} />
        </div>
      </div>

      <div className="nami-landing-hero-mobile-pass">
        <LandingPassportCard member={officialMember} />
      </div>
    </div>
  );
}
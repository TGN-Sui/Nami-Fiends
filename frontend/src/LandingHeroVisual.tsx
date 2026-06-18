import { type CSSProperties, type ReactElement, type ReactNode } from 'react';

import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import { members, type NamiMember } from './uiMockData.js';

const HERO_MEMBER = members[0]!;
const HERO_ELITE_MEMBER = members.find((member) => member.tier === 'Elite' && member.signal === 'Green') ?? members[7]!;

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

export function LandingHeroVisual(): ReactElement {
  return (
    <div className="nami-landing-hero-visual" aria-hidden="true">
      <div className="nami-landing-hero-collage">
        <div className="nami-landing-hero-passport-slot is-desktop-passport">
          <LandingPassportCard member={HERO_MEMBER} />
        </div>

        <div className="nami-landing-hero-elite-passport-slot is-desktop-passport">
          <LandingPassportCard member={HERO_ELITE_MEMBER} withGlitter />
        </div>
      </div>

      <div className="nami-landing-hero-mobile-pass">
        <LandingPassportCard member={HERO_MEMBER} />
      </div>
    </div>
  );
}
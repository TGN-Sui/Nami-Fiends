import { useRef, type ReactElement, type ReactNode } from 'react';

import { isNamiTeamMember, memberRainbowBorderClass } from './channel-surface.js';
import {
  ConductSignalDot,
  memberTierSurfaceClass,
  UniformMemberAvatar,
  isMemberFoilEligible,
} from './member-avatar.js';
import { members, type ConductSignal, type NamiMember } from './uiMockData.js';

function isPassportInteractive(member: NamiMember, signal: ConductSignal): boolean {
  if (member.tier === 'Pro' || member.tier === 'Elite') {
    return true;
  }

  return isMemberFoilEligible(member, signal);
}

function passportTierFoilClass(member: NamiMember): string {
  if (member.tier === 'Elite') return 'is-elite-passport-foil';
  if (member.tier === 'Pro') return 'is-pro-passport-foil';

  return '';
}

function memberProgression(member: NamiMember): {
  level: number;
  currentXp: number;
  guild: string;
  squad: string;
  seasonXp: number;
  collectorNumber: number;
} {
  const memberIndex = Math.max(0, members.findIndex((entry) => entry.id === member.id));
  const level = Math.min(100, 18 + memberIndex * 9 + (member.name.length % 8));
  const currentXp = Math.min(999, 420 + memberIndex * 73);
  const guildSets = [
    ['Wave Raiders', 'Creator Circle'],
    ['Night Market PvP', 'Retro Arena'],
    ['Builder League', 'Sui Creators'],
    ['Ocean Mint Crew', 'Signal Watch'],
  ];
  const squadSets = [
    ['Alpha Squad', 'Mint Watch'],
    ['Raid Team', 'Patch Crew'],
    ['Builder Squad', 'Event Ops'],
    ['Support Squad', 'Lore Team'],
  ];
  const guilds = guildSets[memberIndex % guildSets.length] ?? guildSets[0]!;
  const squads = squadSets[memberIndex % squadSets.length] ?? squadSets[0]!;

  return {
    level,
    currentXp,
    guild: guilds[0]!,
    squad: squads[0]!,
    seasonXp: level * 1000 + currentXp,
    collectorNumber: memberIndex + 1,
  };
}

function memberHandle(member: NamiMember): string {
  if (member.id === 'm1') {
    return '@npcgamer';
  }

  return '@' + member.name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

type TcgFoilPassportCardProps = {
  member: NamiMember;
  signal?: ConductSignal;
  layout?: 'vertical' | 'horizontal';
  onOpenPassport?: () => void;
  children?: ReactNode;
};

export function TcgFoilPassportCard(props: TcgFoilPassportCardProps): ReactElement {
  const reviewedSignal = props.signal ?? props.member.signal;
  const progression = memberProgression(props.member);
  const layout = props.layout ?? 'vertical';
  const passportInteractive = isPassportInteractive(props.member, reviewedSignal);
  const tierFoilClass = passportTierFoilClass(props.member);
  const tierSurfaceClass = memberTierSurfaceClass(props.member);
  const isClickable = Boolean(props.onOpenPassport);
  const profileCardFrameRef = useRef<HTMLDivElement | null>(null);
  const foilFrameRef = useRef<number | null>(null);
  const foilStateRef = useRef({
    current: {
      foilX: 50,
      foilY: 18,
      cardTiltX: 0,
      cardTiltY: 0,
      lightX: 0,
      lightY: 0,
      cardOpacity: 0.36,
      passportLightX: 0,
      passportLightY: 0,
      passportOpacity: 0.22,
    },
    target: {
      foilX: 50,
      foilY: 18,
      cardTiltX: 0,
      cardTiltY: 0,
      lightX: 0,
      lightY: 0,
      cardOpacity: 0.36,
      passportLightX: 0,
      passportLightY: 0,
      passportOpacity: 0.22,
    },
  });

  function writeFoilStyles(card: HTMLElement): void {
    const current = foilStateRef.current.current;

    card.style.setProperty('--card-foil-x', current.foilX.toFixed(2) + '%');
    card.style.setProperty('--card-foil-y', current.foilY.toFixed(2) + '%');
    card.style.setProperty('--card-body-tilt-x', current.cardTiltX.toFixed(3) + 'deg');
    card.style.setProperty('--card-body-tilt-y', current.cardTiltY.toFixed(3) + 'deg');
    card.style.setProperty('--card-light-x', current.lightX.toFixed(2) + 'px');
    card.style.setProperty('--card-light-y', current.lightY.toFixed(2) + 'px');
    card.style.setProperty('--card-foil-opacity', current.cardOpacity.toFixed(3));
    card.style.setProperty('--passport-light-x', current.passportLightX.toFixed(2) + 'px');
    card.style.setProperty('--passport-light-y', current.passportLightY.toFixed(2) + 'px');
    card.style.setProperty('--passport-foil-opacity', current.passportOpacity.toFixed(3));
  }

  function animateFoil(card: HTMLElement): void {
    const state = foilStateRef.current;
    const current = state.current;
    const target = state.target;
    const smoothing = 0.105;

    current.foilX += (target.foilX - current.foilX) * smoothing;
    current.foilY += (target.foilY - current.foilY) * smoothing;
    current.cardTiltX += (target.cardTiltX - current.cardTiltX) * smoothing;
    current.cardTiltY += (target.cardTiltY - current.cardTiltY) * smoothing;
    current.lightX += (target.lightX - current.lightX) * smoothing;
    current.lightY += (target.lightY - current.lightY) * smoothing;
    current.cardOpacity += (target.cardOpacity - current.cardOpacity) * smoothing;
    current.passportLightX += (target.passportLightX - current.passportLightX) * smoothing;
    current.passportLightY += (target.passportLightY - current.passportLightY) * smoothing;
    current.passportOpacity += (target.passportOpacity - current.passportOpacity) * smoothing;

    writeFoilStyles(card);

    const remaining = Math.max(
      Math.abs(target.foilX - current.foilX),
      Math.abs(target.foilY - current.foilY),
      Math.abs(target.cardTiltX - current.cardTiltX),
      Math.abs(target.cardTiltY - current.cardTiltY)
    );

    if (remaining > 0.01) {
      foilFrameRef.current = window.requestAnimationFrame(() => animateFoil(card));
      return;
    }

    Object.assign(current, target);
    writeFoilStyles(card);
    foilFrameRef.current = null;
  }

  function startFoilAnimation(card: HTMLElement): void {
    if (foilFrameRef.current !== null) {
      return;
    }

    foilFrameRef.current = window.requestAnimationFrame(() => animateFoil(card));
  }

  function updateCardFoil(event: { currentTarget: HTMLElement; clientX: number; clientY: number }): void {
    const card = profileCardFrameRef.current;

    if (!card || !passportInteractive) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const pointerY = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    const fromCenterX = pointerX - 0.5;
    const fromCenterY = pointerY - 0.5;

    foilStateRef.current.target = {
      foilX: pointerX * 100,
      foilY: pointerY * 100,
      cardTiltX: -fromCenterY * 8,
      cardTiltY: fromCenterX * 8,
      lightX: fromCenterX * 14,
      lightY: fromCenterY * 14,
      cardOpacity: 0.58,
      passportLightX: fromCenterX * 9,
      passportLightY: fromCenterY * 9,
      passportOpacity: 0.34,
    };

    startFoilAnimation(card);
  }

  function resetCardFoil(): void {
    const card = profileCardFrameRef.current;

    if (!card) {
      return;
    }

    foilStateRef.current.target = {
      foilX: 50,
      foilY: 18,
      cardTiltX: 0,
      cardTiltY: 0,
      lightX: 0,
      lightY: 0,
      cardOpacity: 0.36,
      passportLightX: 0,
      passportLightY: 0,
      passportOpacity: 0.22,
    };

    startFoilAnimation(card);
  }

  function openPassportFromCard(): void {
    props.onOpenPassport?.();
  }

  return (
    <article
      aria-label={isClickable ? 'Open Nami Passport' : undefined}
      className={
        'nami-profile-card-shell tcg-foil-passport-shell ' +
        (layout === 'horizontal'
          ? 'nami-profile-card-shell-horizontal is-horizontal-tcg-passport'
          : 'nami-profile-card-shell-vertical is-uniform-vertical-passport') +
        (passportInteractive ? ' is-tcg-foil-eligible' : '') +
        (isClickable ? ' is-clickable-passport' : '') +
        (tierFoilClass ? ' ' + tierFoilClass : '') +
        (tierSurfaceClass ? ' ' + tierSurfaceClass : '')
      }
      onClick={isClickable ? openPassportFromCard : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openPassportFromCard();
              }
            }
          : undefined
      }
      onPointerLeave={resetCardFoil}
      onPointerMove={updateCardFoil}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div
        className={
          'nami-profile-card-frame tcg-foil-passport-frame ' +
          (layout === 'horizontal'
            ? 'nami-profile-card-frame-horizontal tcg-foil-passport-frame-horizontal'
            : 'nami-profile-card-frame-vertical tcg-foil-passport-frame-vertical') +
          (tierFoilClass ? ' ' + tierFoilClass : '') +
          memberRainbowBorderClass(props.member)
        }
        ref={profileCardFrameRef}
      >
        <div className="nami-profile-card-header">
          <span className="mini-badge">
            {isNamiTeamMember(props.member) ? 'Official Nami Team Passport' : 'Nami Passport'}
          </span>
          <strong>{props.member.tier}</strong>
        </div>

        {layout === 'horizontal' ? (
          <div className="tcg-passport-horizontal-identity">
            <UniformMemberAvatar className="nami-profile-card-avatar" member={props.member} signal={reviewedSignal} />

            <div className="nami-profile-card-nameplate">
              <div className="profile-signal-badge-row">
                <span className="profile-signal-chip is-signal-icon-only" title={reviewedSignal + ' signal'}>
                  <ConductSignalDot signal={reviewedSignal} />
                </span>
                <span className="profile-badge-icon profile-badge-icon-custom">{props.member.tier.slice(0, 1)}</span>
              </div>
              <h2>{props.member.name}</h2>
              <p>{props.member.badge} · {reviewedSignal === 'Green' ? 'Verified member' : 'Under review'}</p>
            </div>
          </div>
        ) : (
          <>
            <UniformMemberAvatar className="nami-profile-card-avatar" member={props.member} signal={reviewedSignal} />

            <div className="nami-profile-card-nameplate">
              <div className="profile-signal-badge-row">
                <span className="profile-signal-chip is-signal-icon-only" title={reviewedSignal + ' signal'}>
                  <ConductSignalDot signal={reviewedSignal} />
                </span>
                <span className="profile-badge-icon profile-badge-icon-custom">{props.member.tier.slice(0, 1)}</span>
              </div>
              <h2>{props.member.name}</h2>
              <p>{props.member.badge} · {reviewedSignal === 'Green' ? 'Verified member' : 'Under review'}</p>
            </div>
          </>
        )}

        <div className="nami-profile-card-stats">
          <div>
            <span>Level</span>
            <strong>{progression.level}</strong>
          </div>
          <div>
            <span>XP</span>
            <strong>{progression.currentXp}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{reviewedSignal === 'Green' ? 'Verified' : 'Review'}</strong>
          </div>
        </div>

        {layout === 'horizontal' ? (
          <div className="nami-profile-card-details tcg-passport-horizontal-details">
            <div>
              <span>Handle</span>
              <strong>{memberHandle(props.member)}</strong>
            </div>
            <div>
              <span>Guild</span>
              <strong>{progression.guild}</strong>
            </div>
            <div>
              <span>Squad</span>
              <strong>{progression.squad}</strong>
            </div>
            <div>
              <span>Season XP</span>
              <strong>{progression.seasonXp.toLocaleString()}</strong>
            </div>
            <div>
              <span>Specialty</span>
              <strong>{props.member.badge}</strong>
            </div>
            <div>
              <span>Collectors #</span>
              <strong>#{progression.collectorNumber}</strong>
            </div>
            <div>
              <span>Verification</span>
              <strong>{reviewedSignal === 'Green' ? 'Identity verified' : 'Signal review active'}</strong>
            </div>
            <div>
              <span>Passport</span>
              <strong>Earned through play, not payment</strong>
            </div>
          </div>
        ) : null}
      </div>

      {props.children ? (
        <div
          className="tcg-passport-card-children"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {props.children}
        </div>
      ) : null}
    </article>
  );
}
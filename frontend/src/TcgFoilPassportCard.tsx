import { useRef, type ReactElement, type ReactNode } from 'react';

import {
  isOfficialNamiGalaxyMember,
  memberDisplayRankLabel,
  memberRainbowBorderClass,
  officialNamiPassportMarkLabel,
} from './channel-surface.js';
import { isMemberVerified } from './member-access.js';
import { readMemberArcadeBubblePassportStats } from './arcade-bubble-game-store.js';
import { getNamiProgression } from './member-progression.js';
import {
  isOwnerPassportMember,
  resolveOwnerPassportLabels,
} from './owner-passport-display.js';
import { OwnerEditableImage } from './OwnerEditableImage.js';
import { PassportHoverDetail } from './PassportHoverDetail.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';
import {
  ConductSignalDot,
  memberTierSurfaceClass,
  UniformMemberAvatar,
  isMemberFoilEligible,
} from './member-avatar.js';
import { MemberPreferenceStrip } from './MemberPreferenceStrip.js';
import {
  PassportDisplayNameEditor,
  PassportNameHistoryButton,
} from './PassportDisplayNameControls.js';
import { resolvePassportPlayerScore } from './player-star-display.js';
import { PlayerStarScoreDisplay } from './PlayerStarScoreDisplay.js';
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
  const snapshot = getNamiProgression(member);
  const memberIndex = Math.max(0, members.findIndex((entry) => entry.id === member.id));

  return {
    level: snapshot.level,
    currentXp: snapshot.currentXp,
    guild: snapshot.guilds[0] ?? '—',
    squad: snapshot.squads[0] ?? '—',
    seasonXp: snapshot.seasonXp,
    collectorNumber: memberIndex + 1,
  };
}

function conductSignalHoverDetail(signal: ConductSignal): string {
  switch (signal) {
    case 'Green':
      return 'Verified conduct status — trusted for chat, feeds, and community tools.';
    case 'Orange':
      return 'Conduct review in progress — some surfaces may stay limited until cleared.';
    case 'Red':
      return 'Conduct restriction active — moderation or review is affecting access.';
    case 'Black':
      return 'Severe conduct restriction — highest-priority safety review state.';
    default:
      return signal + ' conduct signal shown on your passport.';
  }
}

function passportMarkHoverDetail(
  member: NamiMember,
  markLabel: string,
  isOfficialGalaxy: boolean,
  ownerPassport: boolean
): string {
  if (isOfficialGalaxy) {
    return markLabel + ' — exclusive official owner passport identity for the Nami platform.';
  }

  if (ownerPassport) {
    return markLabel + ' — owner passport header label; cosmetic only and separate from login.';
  }

  if (markLabel.includes('Team')) {
    return markLabel + ' — marks this passport as an Official Nami Team identity.';
  }

  return markLabel + ' — passport type label shown at the top of your Nami Passport card.';
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
  playerScore?: number | null;
  children?: ReactNode;
};

export function TcgFoilPassportCard(props: TcgFoilPassportCardProps): ReactElement {
  const connectedOwner = readResolvedProtocolOwner();
  const reviewedSignal = props.signal ?? props.member.signal;
  const ownerPassport = isOwnerPassportMember(props.member, connectedOwner);
  const ownerLabels = resolveOwnerPassportLabels(connectedOwner);
  const progression = memberProgression(props.member);
  const arcadeBubbleStats = readMemberArcadeBubblePassportStats(props.member.id);
  const layout = props.layout ?? 'vertical';
  const passportInteractive = ownerPassport || isPassportInteractive(props.member, reviewedSignal);
  const displayTier = ownerPassport
    ? (ownerLabels?.primaryLabel ?? 'Nami CEO')
    : memberDisplayRankLabel(props.member);
  const displayBadge = ownerLabels?.secondaryLabel ?? props.member.badge;
  const displayLevel = ownerPassport ? 'Official' : String(progression.level);
  const displayXp = ownerPassport ? '—' : String(progression.currentXp);
  const displayStatus = ownerPassport ? 'Nami Official' : reviewedSignal === 'Green' ? 'Verified' : 'Review';
  const displaySubtitle = ownerPassport
    ? displayBadge + ' · Nami Official'
    : displayBadge + ' · ' + (reviewedSignal === 'Green' ? 'Verified member' : 'Under review');
  const tierFoilClass = passportTierFoilClass(props.member);
  const tierSurfaceClass = memberTierSurfaceClass(props.member);
  const isOfficialGalaxy = isOfficialNamiGalaxyMember(props.member);
  const hasGalaxyRainbowShell = isOfficialGalaxy || ownerPassport;
  const isClickable = Boolean(props.onOpenPassport);
  const resolvedPlayerScore = resolvePassportPlayerScore(props.member, props.playerScore);
  const passportTiltRef = useRef<HTMLDivElement | null>(null);
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
    const card = passportTiltRef.current;

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
    const card = passportTiltRef.current;

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

  const passportMarkLabel = officialNamiPassportMarkLabel(props.member);

  function passportNameplateIcons(): ReactElement {
    return (
      <div className="profile-signal-badge-row">
        <PassportHoverDetail
          detail={conductSignalHoverDetail(reviewedSignal)}
          label={reviewedSignal + ' conduct signal'}
        >
          <span className="profile-signal-chip is-signal-icon-only">
            <ConductSignalDot signal={reviewedSignal} />
          </span>
        </PassportHoverDetail>
        <PassportHoverDetail
          detail={displayTier + ' tier badge icon displayed beside your conduct signal.'}
          label="Passport tier badge"
        >
          <OwnerEditableImage
            className="profile-badge-icon profile-badge-icon-custom passport-tier-badge-editable"
            fallback={<span aria-hidden="true">{displayTier.slice(0, 1)}</span>}
            label="Passport tier badge"
            nested
            slotId="passport-tier-badge"
          />
        </PassportHoverDetail>
      </div>
    );
  }

  function passportAvatar(member: NamiMember): ReactElement {
    const avatar = (
      <UniformMemberAvatar className="nami-profile-card-avatar" member={member} signal={reviewedSignal} />
    );

    return (
      <PassportHoverDetail
        block
        detail={
          member.name +
          "'s passport portrait. Updates from profile edits and avatar uploads."
        }
        label="Passport avatar"
      >
        {avatar}
      </PassportHoverDetail>
    );
  }

  return (
    <article
      aria-label={isClickable ? 'Open Nami Passport' : undefined}
      className={
        'nami-profile-card-shell tcg-foil-passport-shell ' +
        (layout === 'horizontal'
          ? 'nami-profile-card-shell-horizontal is-horizontal-tcg-passport is-uniform-horizontal-passport'
          : 'nami-profile-card-shell-vertical is-uniform-vertical-passport') +
        (passportInteractive ? ' is-tcg-foil-eligible' : '') +
        (isClickable ? ' is-clickable-passport' : '') +
        (hasGalaxyRainbowShell ? ' is-nami-official-galaxy-passport has-rainbow-foil' : '') +
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
          'tcg-foil-passport-tilt-root' +
          (passportInteractive ? ' is-tcg-foil-eligible' : '') +
          (hasGalaxyRainbowShell ? ' has-rainbow-foil' : '')
        }
        ref={passportTiltRef}
      >
        {hasGalaxyRainbowShell ? (
          <span aria-hidden="true" className="tcg-passport-rainbow-border" />
        ) : null}
        <div
          className={
            'nami-profile-card-frame tcg-foil-passport-frame ' +
          (layout === 'horizontal'
            ? 'nami-profile-card-frame-horizontal tcg-foil-passport-frame-horizontal'
            : 'nami-profile-card-frame-vertical tcg-foil-passport-frame-vertical') +
          (tierFoilClass ? ' ' + tierFoilClass : '') +
          (hasGalaxyRainbowShell ? '' : memberRainbowBorderClass(props.member))
        }
      >
        {(isOfficialGalaxy || ownerPassport) && (
  <div 
    aria-hidden="true" 
    className={`nami-official-galaxy-sky ${isOfficialGalaxy ? 'is-fiend-galaxy' : 'is-owner-galaxy'}`}
  >
    {/* Deep space nebula layer */}
    <div className="galaxy-nebula" />
    
    {/* Multiple animated stars */}
    <div className="galaxy-stars">
      <span className="star star-1" />
      <span className="star star-2" />
      <span className="star star-3" />
      <span className="star star-4" />
    </div>

    {/* Main shooting star */}
    <span className="nami-official-galaxy-shooting-star" />

    {/* Subtle cosmic glow overlay */}
    <div className="galaxy-glow" />
  </div>
)}

        <div className="nami-profile-card-header tcg-passport-card-header">
          <div className="tcg-passport-card-header-mark-slot">
            <PassportHoverDetail
              detail={passportMarkHoverDetail(
                props.member,
                passportMarkLabel,
                isOfficialGalaxy,
                ownerPassport
              )}
              label={isOfficialGalaxy ? 'Official galaxy passport mark' : 'Passport header mark'}
            >
              <OwnerEditableImage
                className="passport-header-mark-editable"
                fallback={
                  <span className="mini-badge">
                    {passportMarkLabel}
                  </span>
                }
                imageClassName="passport-header-mark-image"
                label={isOfficialGalaxy ? 'Official galaxy passport mark' : 'Passport header mark'}
                nested
                slotId={isOfficialGalaxy ? 'passport-official-team-mark' : 'passport-header-mark'}
              />
            </PassportHoverDetail>
          </div>
          <div className="tcg-passport-card-header-tier-slot">
            <PassportHoverDetail
              align="end"
              detail={displayTier + ' — rank or tier label shown on your passport header.'}
              label="Passport tier chip"
            >
              <OwnerEditableImage
                className="passport-tier-chip-editable"
                fallback={<strong>{displayTier}</strong>}
                imageClassName="passport-tier-chip-image"
                label="Passport tier chip"
                nested
                slotId="passport-tier-chip"
              />
            </PassportHoverDetail>
          </div>
        </div>

        {layout === 'horizontal' ? (
          <div className="tcg-passport-horizontal-identity">
            <div className="tcg-passport-avatar-stack">
              {passportAvatar(props.member)}
              <div className="passport-player-star-row">
                <PlayerStarScoreDisplay score={resolvedPlayerScore} showScore={false} />
              </div>
            </div>

            <div className="nami-profile-card-nameplate">
              {passportNameplateIcons()}
              <PassportDisplayNameEditor fallbackName={props.member.name} member={props.member} />
              <PassportNameHistoryButton fallbackName={props.member.name} member={props.member} />
              <p>{displaySubtitle}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="tcg-passport-avatar-stack">
              {passportAvatar(props.member)}
              <div className="passport-player-star-row">
                <PlayerStarScoreDisplay score={resolvedPlayerScore} showScore={false} />
              </div>
            </div>

            <div className="nami-profile-card-nameplate">
              {passportNameplateIcons()}
              <h2>{props.member.name}</h2>
              <p>{displaySubtitle}</p>
            </div>
          </>
        )}

        <div className="nami-profile-card-stats">
          <div>
            <span>Level</span>
            <strong>{displayLevel}</strong>
          </div>
          <div>
            <span>XP</span>
            <strong>{displayXp}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{displayStatus}</strong>
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
              <strong>{displayBadge}</strong>
            </div>
            <div>
              <span>Collectors #</span>
              <strong>#{progression.collectorNumber}</strong>
            </div>
            <div>
              <span>Arcade Bubbles</span>
              <strong>{arcadeBubbleStats.totalBubblesPopped.toLocaleString()}</strong>
            </div>
            <div>
              <span>Verification</span>
              <strong>
                {ownerPassport
                  ? 'Nami Official owner'
                  : isMemberVerified(props.member)
                    ? 'Identity verified'
                    : props.member.tier === 'NPC'
                      ? 'Claim passport to verify'
                      : 'Signal review active'}
              </strong>
            </div>
            <div>
              <span>Passport</span>
              <strong>
                {ownerPassport ? 'Owner labels, not player progression' : 'Earned through play, not payment'}
              </strong>
            </div>
            <MemberPreferenceStrip member={props.member} variant="passport-horizontal" />
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
      </div>
    </article>
  );
}
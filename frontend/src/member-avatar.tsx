import { type CSSProperties, type ReactElement, type ReactNode } from 'react';

import { withMemberAvatar } from './member-avatar-store.js';
import { withMemberProfile } from './member-profile-store.js';
import { members, type ConductSignal, type NamiMember } from './uiMockData.js';

export function signalClass(signal: ConductSignal): string {
  return 'signal-ring signal-' + signal.toLowerCase();
}

function signalDotClass(signal: ConductSignal): string {
  return 'signal-' + signal.toLowerCase();
}

export function ConductSignalDot(props: {
  signal: ConductSignal;
  className?: string;
  size?: 'sm' | 'md';
}): ReactElement {
  const sizeClass = props.size === 'sm' ? ' is-conduct-signal-dot-sm' : '';

  return (
    <i
      aria-label={props.signal + ' conduct signal'}
      className={
        'conduct-signal-dot ' +
        signalDotClass(props.signal) +
        sizeClass +
        (props.className ? ' ' + props.className : '')
      }
      title={props.signal}
    />
  );
}

export function isMemberFoilEligible(member: NamiMember, signal: ConductSignal = member.signal): boolean {
  if (signal !== 'Green') return false;
  if (member.tier === 'NPC') return false;
  if (/sponsor|sponsored|squad/i.test(member.badge)) return false;

  return true;
}

export function memberTierSurfaceClass(member: NamiMember): string {
  if (member.tier === 'Elite') return 'is-elite-surface';
  if (member.tier === 'Pro') return 'is-pro-surface';

  return '';
}

export function chatMemberCardTierClass(member: NamiMember): string {
  if (member.tier === 'Elite') return ' is-elite-chat-member-card';
  if (member.tier === 'Pro') return ' is-pro-chat-member-card';

  return '';
}

function isChatTierFoilSurface(baseClass: string): boolean {
  return baseClass.includes('chat-member-avatar') || baseClass.includes('message-avatar');
}

function usesChatTierFoil(member: NamiMember, baseClass: string): boolean {
  return isChatTierFoilSurface(baseClass) && (member.tier === 'Pro' || member.tier === 'Elite');
}

function memberAvatarAssetVariables(member: NamiMember): CSSProperties {
  const avatarImageUrl = member.avatarImageUrl?.trim();

  if (!avatarImageUrl) {
    return {
      '--member-avatar-image': 'none',
      '--member-avatar-image-opacity': '0',
      backgroundImage: 'none',
    } as CSSProperties;
  }

  const cssUrl = 'url("' + avatarImageUrl.replace(/"/g, '\\u0022') + '")';

  return {
    '--member-avatar-image': cssUrl,
    '--member-avatar-image-opacity': '1',
    backgroundImage: cssUrl,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  } as CSSProperties;
}

function memberAvatarClass(
  member: NamiMember,
  baseClass: string,
  signal: ConductSignal = member.signal
): string {
  const foilEligible = isMemberFoilEligible(member, signal);
  const chatTierFoil = usesChatTierFoil(member, baseClass);

  return (
    baseClass +
    ' uniform-member-avatar' +
    ' ' +
    signalClass(signal) +
    (member.avatarImageUrl ? ' has-member-avatar-image' : '') +
    (chatTierFoil ? ' ' + memberTierSurfaceClass(member) : '') +
    (foilEligible && !chatTierFoil ? ' is-uniform-foil-frame' : ' is-uniform-standard-frame')
  );
}

function tierFoilLayer(member: NamiMember, baseClass: string): ReactElement | null {
  if (!usesChatTierFoil(member, baseClass)) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={
        'uniform-member-tier-foil ' +
        (member.tier === 'Elite' ? 'is-elite-tier-foil' : 'is-pro-tier-foil')
      }
    />
  );
}

export function UniformMemberAvatar(props: {
  member: NamiMember;
  signal?: ConductSignal;
  className?: string;
  children?: ReactNode;
}): ReactElement {
  const member = withMemberProfile(withMemberAvatar(props.member));
  const signal = props.signal ?? member.signal;
  const baseClass = props.className ?? 'chat-member-avatar';
  const chatTierFoil = usesChatTierFoil(member, baseClass);
  const genericFoil = isMemberFoilEligible(member, signal) && !chatTierFoil;

  return (
    <div
      className={memberAvatarClass(member, baseClass, signal)}
      style={memberAvatarAssetVariables(member)}
    >
      {tierFoilLayer(member, baseClass)}
      {genericFoil ? <span className="uniform-member-avatar-foil" aria-hidden="true" /> : null}
      {!member.avatarImageUrl ? (
        <span className="member-avatar-initials">{member.name.slice(0, 2).toUpperCase()}</span>
      ) : null}
      {props.children}
    </div>
  );
}

export function UniformMemberAvatarButton(props: {
  member: NamiMember;
  signal?: ConductSignal;
  className?: string;
  onClick: () => void;
}): ReactElement {
  const member = withMemberProfile(withMemberAvatar(props.member));
  const signal = props.signal ?? member.signal;
  const baseClass = props.className ?? 'message-avatar message-avatar-button';
  const chatTierFoil = usesChatTierFoil(member, baseClass);
  const genericFoil = isMemberFoilEligible(member, signal) && !chatTierFoil;

  return (
    <button
      className={memberAvatarClass(member, baseClass, signal)}
      onClick={props.onClick}
      style={memberAvatarAssetVariables(member)}
      type="button"
    >
      {tierFoilLayer(member, baseClass)}
      {genericFoil ? <span className="uniform-member-avatar-foil" aria-hidden="true" /> : null}
      {!member.avatarImageUrl ? (
        <span className="member-avatar-initials">{member.name.slice(0, 2).toUpperCase()}</span>
      ) : null}
    </button>
  );
}

export function selfMember(): NamiMember {
  const baseMember = members.find((member) => member.id === 'm1') ?? members[0]!;

  return withMemberProfile(withMemberAvatar(baseMember));
}
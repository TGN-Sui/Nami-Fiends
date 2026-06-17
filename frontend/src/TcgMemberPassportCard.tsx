import { type ReactElement, type ReactNode } from 'react';

import { members, type ConductSignal, type NamiMember } from './uiMockData.js';

function memberProgression(member: NamiMember): { level: number; currentXp: number } {
  const memberIndex = Math.max(0, members.findIndex((entry) => entry.id === member.id));
  const level = Math.min(100, 18 + memberIndex * 9 + (member.name.length % 8));
  const currentXp = Math.min(999, 420 + memberIndex * 73);

  return { level, currentXp };
}

function signalClass(signal: ConductSignal): string {
  return 'signal-ring signal-' + signal.toLowerCase();
}

function memberInitials(member: NamiMember): string {
  return member.avatarSeed || member.name.slice(0, 2).toUpperCase();
}

export function TcgMemberPassportCard(props: {
  member: NamiMember;
  signal?: ConductSignal;
  children?: ReactNode;
}): ReactElement {
  const reviewedSignal = props.signal ?? props.member.signal;
  const progression = memberProgression(props.member);
  const foilEligible = props.member.tier !== 'NPC' && reviewedSignal === 'Green';

  return (
    <article
      className={
        'tcg-member-passport-card panel' + (foilEligible ? ' is-tcg-foil-eligible' : '')
      }
    >
      <div className="tcg-passport-frame">
        <header className="tcg-passport-header">
          <span className="mini-badge">Member Passport</span>
          <strong>{props.member.tier}</strong>
        </header>

        <div className={'tcg-passport-avatar ' + signalClass(reviewedSignal)}>
          {memberInitials(props.member)}
          <i>Lv {progression.level}</i>
        </div>

        <div className="tcg-passport-nameplate">
          <h2>{props.member.name}</h2>
          <p>{props.member.badge} · {reviewedSignal} Signal</p>
        </div>

        <div className="tcg-passport-stats">
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

        <footer className="tcg-passport-footer">
          <span>Nami Collectors Series</span>
          <small>#{members.findIndex((entry) => entry.id === props.member.id) + 1}</small>
        </footer>
      </div>

      {props.children}
    </article>
  );
}
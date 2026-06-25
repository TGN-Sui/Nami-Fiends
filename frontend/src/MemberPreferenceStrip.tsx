import { useMemo, type ReactElement } from 'react';

import { PassportHoverDetail } from './PassportHoverDetail.js';
import {
  profileGenreOptions,
  profilePlatformOptions,
  readMemberProfilePreferences,
  useSelfProfileEdits,
} from './member-profile-store.js';
import { isSelfMember } from './surface-preferences.js';
import type { NamiMember } from './uiMockData.js';

const platformIndicatorLabels: Record<(typeof profilePlatformOptions)[number], string> = {
  PC: 'PC',
  Console: 'CON',
  Mobile: 'MOB',
};

const genreIndicatorLabels: Record<string, string> = {
  Shooter: 'SHR',
  MOBA: 'MOB',
  RPG: 'RPG',
  Sport: 'SPT',
  Racing: 'RAC',
  Fighting: 'FGT',
  Adventure: 'ADV',
  Strategy: 'STR',
  RTS: 'RTS',
  Indie: 'IND',
  Platform: 'PLT',
  Simulator: 'SIM',
  Puzzle: 'PUZ',
  Tactical: 'TAC',
  TBS: 'TBS',
  'Hack & Slash': 'H&S',
  Music: 'MUS',
  Arcade: 'ARC',
  'Visual Novel': 'VN',
  'Card & Board': 'C&B',
};

function preferenceIndicatorLabel(kind: 'platform' | 'genre', value: string): string {
  if (kind === 'platform') {
    return platformIndicatorLabels[value as (typeof profilePlatformOptions)[number]] ?? value.slice(0, 3).toUpperCase();
  }

  return genreIndicatorLabels[value] ?? value.slice(0, 3).toUpperCase();
}

export function MemberPreferenceStrip(props: {
  member: NamiMember;
  variant?: 'profile' | 'passport-horizontal';
}): ReactElement {
  const selfProfileEdits = useSelfProfileEdits();
  const isSelf = isSelfMember(props.member.id);

  const preferences = useMemo(() => {
    if (isSelf) {
      return {
        preferredPlatforms: selfProfileEdits.preferredPlatforms,
        preferredGenres: selfProfileEdits.preferredGenres,
      };
    }

    return readMemberProfilePreferences(props.member.id);
  }, [
    isSelf,
    props.member.id,
    selfProfileEdits.preferredGenres,
    selfProfileEdits.preferredPlatforms,
  ]);

  const variant = props.variant ?? 'profile';

  if (variant === 'passport-horizontal') {
    const selectedPlatforms = profilePlatformOptions.filter((platform) =>
      preferences.preferredPlatforms.includes(platform)
    );
    const selectedGenres = profileGenreOptions.filter((genre) =>
      preferences.preferredGenres.includes(genre)
    );

    if (selectedPlatforms.length === 0 && selectedGenres.length === 0) {
      return <></>;
    }

    return (
      <div className="member-preference-strip is-passport-horizontal-preference-strip is-passport-indicator-strip">
        <div
          aria-label="Preferred platforms and genre lounges"
          className="member-preference-indicator-tabs is-passport-preference-icons"
          role="list"
        >
          {selectedPlatforms.map((platform) => (
            <PassportHoverDetail
              detail={platform + ' is a preferred platform for this member.'}
              key={'platform-' + platform}
              label={platform}
            >
              <span
                className="member-preference-indicator-tab is-active-preference-indicator"
                role="listitem"
              >
                {preferenceIndicatorLabel('platform', platform)}
              </span>
            </PassportHoverDetail>
          ))}
          {selectedGenres.map((genre) => (
            <PassportHoverDetail
              detail={genre + ' is a preferred genre lounge for this member.'}
              key={'genre-' + genre}
              label={genre}
            >
              <span
                className="member-preference-indicator-tab is-active-preference-indicator"
                role="listitem"
              >
                {preferenceIndicatorLabel('genre', genre)}
              </span>
            </PassportHoverDetail>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="member-preference-strip">
      <div className="member-preference-strip-group">
        <span className="member-preference-strip-label">Preferred platforms</span>
        <div className="member-preference-strip-row" role="list">
          {profilePlatformOptions.map((platform) => {
            const isSelected = preferences.preferredPlatforms.includes(platform);

            return (
              <span
                className={
                  'member-preference-chip' + (isSelected ? ' is-selected-preference-chip' : '')
                }
                key={platform}
                role="listitem"
              >
                {platform}
              </span>
            );
          })}
        </div>
      </div>

      <div className="member-preference-strip-group">
        <span className="member-preference-strip-label">Preferred genre lounges</span>
        <div className="member-preference-strip-row" role="list">
          {preferences.preferredGenres.length > 0 ? (
            preferences.preferredGenres.map((genre) => (
              <span
                className="member-preference-chip is-selected-preference-chip"
                key={genre}
                role="listitem"
              >
                {genre}
              </span>
            ))
          ) : (
            <span className="member-preference-chip">No genre lounges selected</span>
          )}
        </div>
      </div>
    </div>
  );
}
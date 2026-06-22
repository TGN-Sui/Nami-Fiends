import { useMemo, type ReactElement } from 'react';

import {
  profileGenreOptions,
  profilePlatformOptions,
  readMemberProfilePreferences,
  useSelfProfileEdits,
} from './member-profile-store.js';
import { isSelfMember } from './surface-preferences.js';
import type { NamiMember } from './uiMockData.js';

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

  return (
    <div
      className={
        'member-preference-strip' +
        (variant === 'passport-horizontal' ? ' is-passport-horizontal-preference-strip' : '')
      }
    >
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
        <span className="member-preference-strip-label">Preferred genres</span>
        <div className="member-preference-strip-row" role="list">
          {profileGenreOptions.map((genre) => {
            const isSelected = preferences.preferredGenres.includes(genre);

            return (
              <span
                className={'member-preference-chip' + (isSelected ? ' is-selected-preference-chip' : '')}
                key={genre}
                role="listitem"
              >
                {genre}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState, type ReactElement } from 'react';

import {
  collectedBadgesForMember,
  collectedCosmeticsForMember,
  collectedTitlesForMember,
  cosmeticsForKind,
} from './global-chats.js';
import { MemberAvatarUploadCard } from './MemberAvatarUploadCard.js';
import {
  consumeProfileEditFocus,
  PROFILE_EDIT_PANEL_ID,
  useSelfMember,
} from './member-avatar-store.js';
import {
  profileGenreOptions,
  profilePlatformOptions,
  saveSelfProfileEdits,
  useSelfProfileEdits,
  type SelfProfileEdits,
} from './member-profile-store.js';

function toggleChip(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function ProfileEditPanel(): ReactElement {
  const member = useSelfMember();
  const savedProfile = useSelfProfileEdits();
  const collectedBadges = collectedBadgesForMember(member);
  const collectedTitles = collectedTitlesForMember(member);
  const collectedCosmetics = collectedCosmeticsForMember(member);
  const frameCosmetics = cosmeticsForKind(collectedCosmetics, 'frame');
  const themeCosmetics = cosmeticsForKind(collectedCosmetics, 'theme');
  const ringCosmetics = cosmeticsForKind(collectedCosmetics, 'ring');
  const [expanded, setExpanded] = useState(() => consumeProfileEditFocus());
  const [draft, setDraft] = useState<SelfProfileEdits>(savedProfile);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(savedProfile);
  }, [savedProfile]);

  useEffect(() => {
    if (!consumeProfileEditFocus()) {
      return;
    }

    setExpanded(true);

    window.requestAnimationFrame(() => {
      document.getElementById(PROFILE_EDIT_PANEL_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, []);

  function updateDraft(patch: Partial<SelfProfileEdits>): void {
    setDraft((current) => ({ ...current, ...patch }));
    setSavedNotice(false);
  }

  function handleSave(): void {
    saveSelfProfileEdits(draft);
    setSavedNotice(true);
  }

  if (!expanded) {
    return (
      <article className="profile-edit-panel profile-edit-panel-collapsed panel" id={PROFILE_EDIT_PANEL_ID}>
        <button
          className="nami-surface-button is-primary-surface-button profile-edit-toggle-button"
          onClick={() => setExpanded(true)}
          type="button"
        >
          Edit Profile
        </button>
      </article>
    );
  }

  return (
    <article className="profile-edit-panel panel" id={PROFILE_EDIT_PANEL_ID}>
      <div className="profile-edit-panel-heading">
        <span className="mini-badge">Identity</span>
        <h2>Edit Profile</h2>
        <p>Update how you appear across Nami. These edits do not change verification or trust status.</p>
      </div>

      <MemberAvatarUploadCard />

      <div className="profile-edit-form">
        <label className="profile-edit-field">
          <span>Display name</span>
          <input
            maxLength={32}
            onChange={(event) => updateDraft({ displayName: event.target.value })}
            placeholder={member.name}
            type="text"
            value={draft.displayName}
          />
        </label>

        <label className="profile-edit-field">
          <span>Daily status</span>
          <textarea
            maxLength={160}
            onChange={(event) => updateDraft({ dailyStatus: event.target.value })}
            placeholder="Short note for your profile showcase."
            rows={2}
            value={draft.dailyStatus}
          />
        </label>

        <label className="profile-edit-field">
          <span>Bio</span>
          <textarea
            maxLength={280}
            onChange={(event) => updateDraft({ bio: event.target.value })}
            placeholder="Tell the community what you play, build, or collect."
            rows={4}
            value={draft.bio}
          />
        </label>

        <fieldset className="profile-edit-chip-field">
          <legend>Titles & Cosmetics</legend>
          <p className="protocol-hint">Equip collected titles, badges, frames, themes, and rings you own.</p>
        </fieldset>

        <fieldset className="profile-edit-chip-field">
          <legend>Title display</legend>
          <div className="profile-edit-chip-row">
            {collectedTitles.map((title) => (
              <button
                className={
                  'nami-surface-button profile-edit-chip' +
                  (draft.titleDisplay === title.name ? ' is-active-view' : '')
                }
                key={title.id}
                onClick={() => updateDraft({ titleDisplay: title.name })}
                type="button"
              >
                {title.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="profile-edit-chip-field">
          <legend>Badge display</legend>
          <div className="profile-edit-chip-row">
            {collectedBadges.map((badge) => (
              <button
                className={
                  'nami-surface-button profile-edit-chip' +
                  (draft.badgeDisplay === badge.name ? ' is-active-view' : '')
                }
                key={badge.id}
                onClick={() => updateDraft({ badgeDisplay: badge.name })}
                type="button"
              >
                {badge.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="profile-edit-chip-field">
          <legend>Profile frame</legend>
          <div className="profile-edit-chip-row">
            {frameCosmetics.map((cosmetic) => (
              <button
                className={
                  'nami-surface-button profile-edit-chip' +
                  (draft.frameDisplay === cosmetic.name ? ' is-active-view' : '')
                }
                key={cosmetic.id}
                onClick={() => updateDraft({ frameDisplay: cosmetic.name })}
                type="button"
              >
                {cosmetic.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="profile-edit-chip-field">
          <legend>Passport theme</legend>
          <div className="profile-edit-chip-row">
            {themeCosmetics.map((cosmetic) => (
              <button
                className={
                  'nami-surface-button profile-edit-chip' +
                  (draft.themeDisplay === cosmetic.name ? ' is-active-view' : '')
                }
                key={cosmetic.id}
                onClick={() => updateDraft({ themeDisplay: cosmetic.name })}
                type="button"
              >
                {cosmetic.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="profile-edit-chip-field">
          <legend>Signal ring</legend>
          <div className="profile-edit-chip-row">
            {ringCosmetics.map((cosmetic) => (
              <button
                className={
                  'nami-surface-button profile-edit-chip' +
                  (draft.ringDisplay === cosmetic.name ? ' is-active-view' : '')
                }
                key={cosmetic.id}
                onClick={() => updateDraft({ ringDisplay: cosmetic.name })}
                type="button"
              >
                {cosmetic.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="profile-edit-chip-field">
          <legend>Preferred platforms</legend>
          <div className="profile-edit-chip-row">
            {profilePlatformOptions.map((platform) => (
              <button
                className={
                  'nami-surface-button profile-edit-chip' +
                  (draft.preferredPlatforms.includes(platform) ? ' is-active-view' : '')
                }
                key={platform}
                onClick={() =>
                  updateDraft({
                    preferredPlatforms: toggleChip(draft.preferredPlatforms, platform),
                  })
                }
                type="button"
              >
                {platform}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="profile-edit-chip-field">
          <legend>Preferred genres</legend>
          <div className="profile-edit-chip-row">
            {profileGenreOptions.map((genre) => (
              <button
                className={
                  'nami-surface-button profile-edit-chip' +
                  (draft.preferredGenres.includes(genre) ? ' is-active-view' : '')
                }
                key={genre}
                onClick={() =>
                  updateDraft({
                    preferredGenres: toggleChip(draft.preferredGenres, genre),
                  })
                }
                type="button"
              >
                {genre}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="profile-edit-actions">
        <button className="nami-surface-button is-primary-surface-button" onClick={handleSave} type="button">
          Save profile
        </button>
        <button className="nami-surface-button" onClick={() => setExpanded(false)} type="button">
          Collapse
        </button>
        {savedNotice ? <span className="profile-edit-saved-note">Profile updated across Nami.</span> : null}
      </div>
    </article>
  );
}
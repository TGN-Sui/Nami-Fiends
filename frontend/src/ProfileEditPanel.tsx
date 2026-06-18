import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  collectedBadgesForMember,
  collectedCosmeticsForMember,
  collectedTitlesForMember,
  cosmeticsForKind,
} from './global-chats.js';
import {
  clearSelfAvatarOverride,
  consumeProfileEditFocus,
  PROFILE_EDIT_PANEL_ID,
  readSelfAvatarOverride,
  requestProfileEditFocus,
  saveSelfAvatarOverride,
  useSelfMember,
} from './member-avatar-store.js';
import {
  profileGenreOptions,
  profilePlatformOptions,
  saveSelfProfileEdits,
  useSelfProfileEdits,
  type SelfProfileEdits,
} from './member-profile-store.js';

const ACCEPTED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

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
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isReadingAvatar, setIsReadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarOverride = readSelfAvatarOverride();
  const hasCustomAvatar = avatarOverride !== null && avatarOverride.length > 0;

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

  function openAvatarPicker(): void {
    if (!expanded) {
      requestProfileEditFocus();
      setExpanded(true);
    }

    fileInputRef.current?.click();
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
      setAvatarError('Use a PNG, JPG, or WebP image.');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image must be 2 MB or smaller.');
      return;
    }

    setAvatarError(null);
    setIsReadingAvatar(true);

    const reader = new FileReader();

    reader.onload = () => {
      setIsReadingAvatar(false);

      if (typeof reader.result !== 'string') {
        setAvatarError('Could not read that image. Try another file.');
        return;
      }

      saveSelfAvatarOverride(reader.result);
    };

    reader.onerror = () => {
      setIsReadingAvatar(false);
      setAvatarError('Could not read that image. Try another file.');
    };

    reader.readAsDataURL(file);
  }

  function removeAvatar(): void {
    setAvatarError(null);
    clearSelfAvatarOverride();
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

      <section className="profile-edit-media-block">
        <div className="profile-edit-media-copy">
          <strong>Profile avatar</strong>
          <small>
            {hasCustomAvatar
              ? 'Custom display photo active across Nami.'
              : member.avatarImageUrl
                ? 'Default demo avatar active. Upload to replace it site-wide.'
                : 'Initials fallback active. Upload a display photo for your profile.'}
          </small>
        </div>

        <input
          accept="image/png,image/jpeg,image/webp"
          className="member-avatar-upload-input"
          onChange={handleAvatarChange}
          ref={fileInputRef}
          type="file"
        />

        <div className="member-avatar-upload-actions">
          <button
            className="nami-surface-button is-primary-surface-button"
            disabled={isReadingAvatar}
            onClick={openAvatarPicker}
            type="button"
          >
            {isReadingAvatar ? 'Reading image…' : 'Upload display photo'}
          </button>

          {hasCustomAvatar || member.avatarImageUrl ? (
            <button className="nami-surface-button" onClick={removeAvatar} type="button">
              Remove photo
            </button>
          ) : null}
        </div>

        {avatarError ? <p className="member-avatar-upload-error">{avatarError}</p> : null}
      </section>

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
import { useEffect, useState, type ReactElement } from 'react';

import {
  collectedBadgesForMember,
  collectedCosmeticsForMember,
  collectedTitlesForMember,
  cosmeticsForKind,
} from './global-chats.js';
import { MEMBER_AVATAR_UPLOAD_CARD_ID, MemberAvatarUploadCard } from './MemberAvatarUploadCard.js';
import {
  consumeProfileEditFocus,
  PROFILE_EDIT_PANEL_ID,
  useSelfMember,
} from './member-avatar-store.js';
import { canEditProfileCosmetics } from './member-access.js';
import {
  checkDisplayNameAvailability,
  saveMemberDisplayName,
} from './member-display-name-store.js';
import { ChatOverlayEquipPicker } from './ChatOverlayEquipPicker.js';
import {
  profileGenreOptions,
  profilePlatformOptions,
  saveSelfProfileEdits,
  useSelfProfileEdits,
  type SelfProfileEdits,
} from './member-profile-store.js';
import { PROFILE_GENRE_LOUNGE_COUNT } from './platform-genre-options.js';

function toggleChip(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function ProfileEditPanel(): ReactElement {
  const member = useSelfMember();
  const canEditCosmetics = canEditProfileCosmetics(member);
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
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const displayNameAvailability = checkDisplayNameAvailability(draft.displayName || member.name, member.id);

  useEffect(() => {
    setDraft(savedProfile);
  }, [savedProfile]);

  useEffect(() => {
    if (!consumeProfileEditFocus()) {
      return;
    }

    setExpanded(true);

    window.requestAnimationFrame(() => {
      document.getElementById(MEMBER_AVATAR_UPLOAD_CARD_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, []);

  function updateDraft(patch: Partial<SelfProfileEdits>): void {
    setDraft((current) => ({ ...current, ...patch }));
    setSavedNotice(false);
    setDisplayNameError(null);
  }

  function handleSave(): void {
    const trimmedName = draft.displayName.trim();

    if (trimmedName) {
      const nameResult = saveMemberDisplayName(trimmedName, member.id);

      if (!nameResult.ok) {
        setDisplayNameError(nameResult.message);
        setSavedNotice(false);
        return;
      }
    }

    saveSelfProfileEdits(draft);
    setDisplayNameError(null);
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
        <p>
          Update how you appear across Nami. Display name is cosmetic only — it does not affect
          login, linked accounts, or owner access.
        </p>
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
          {draft.displayName.trim() ? (
            <small
              className={
                displayNameAvailability.available
                  ? 'profile-edit-field-hint is-available-name'
                  : 'profile-edit-field-hint is-unavailable-name'
              }
            >
              {displayNameAvailability.available
                ? 'Name is available.'
                : displayNameAvailability.reason}
            </small>
          ) : null}
          {displayNameError ? <small className="profile-edit-field-hint is-unavailable-name">{displayNameError}</small> : null}
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

        {canEditCosmetics ? (
          <>
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
              <legend>Chat overlay</legend>
              <p className="protocol-hint">
                Equip earned chat bubble border art here or under Look & feel in Settings.
              </p>
              <ChatOverlayEquipPicker
                member={member}
                onSelect={(overlayId) => updateDraft({ chatOverlayDisplay: overlayId })}
                selectedOverlayId={draft.chatOverlayDisplay}
              />
            </fieldset>
          </>
        ) : (
          <article className="profile-edit-cosmetics-locked panel">
            <span className="mini-badge">Verified members only</span>
            <h3>Cosmetic loadout locked</h3>
            <p>
              Claim and verify your Nami Passport to equip title display, badge display, profile
              frames, passport themes, and signal rings.
            </p>
          </article>
        )}

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
          <legend>Preferred genre lounges</legend>
          <p className="protocol-hint">
            Choose from the top {PROFILE_GENRE_LOUNGE_COUNT} Genre Lounge bubbles in Game Hub.
          </p>
          <label className="profile-edit-field">
            <span>Add genre lounge</span>
            <select
              onChange={(event) => {
                const genre = event.target.value;

                if (!genre || draft.preferredGenres.includes(genre)) {
                  return;
                }

                updateDraft({
                  preferredGenres: [...draft.preferredGenres, genre],
                });
                event.target.value = '';
              }}
              value=""
            >
              <option value="">Select a genre lounge…</option>
              {profileGenreOptions
                .filter((genre) => !draft.preferredGenres.includes(genre))
                .map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
            </select>
          </label>
          {draft.preferredGenres.length > 0 ? (
            <div className="profile-edit-selected-genres">
              {draft.preferredGenres.map((genre) => (
                <button
                  className="nami-surface-button profile-edit-chip is-active-view"
                  key={genre}
                  onClick={() =>
                    updateDraft({
                      preferredGenres: draft.preferredGenres.filter((entry) => entry !== genre),
                    })
                  }
                  type="button"
                >
                  {genre}
                  <span aria-hidden="true"> ×</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="protocol-hint">No genre lounges selected yet.</p>
          )}
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
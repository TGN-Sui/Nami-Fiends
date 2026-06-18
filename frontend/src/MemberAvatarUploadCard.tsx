import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  MEDIA_UPLOAD_ACCEPTED_LABEL,
  persistMediaImage,
  readFileAsDataUrl,
  validateMediaFile,
} from './media-upload-service.js';
import {
  clearSelfAvatarOverride,
  readSelfAvatarOverride,
  saveSelfAvatarOverride,
  useSelfMember,
} from './member-avatar-store.js';
import { isPreferencesApiAvailable, preferencesStorageHint } from './preferences-sync.js';
import { useProtocolOwner } from './wallet.js';

export function MemberAvatarUploadCard(): ReactElement {
  const member = useSelfMember();
  const { owner } = useProtocolOwner();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const override = readSelfAvatarOverride();
  const hasCustomAvatar = override !== null && override.length > 0;
  const storageHint = preferencesStorageHint('member');
  const currentState = hasCustomAvatar
    ? 'Custom display photo active across Nami.'
    : member.avatarImageUrl
      ? 'Default profile photo active. Upload to replace it site-wide.'
      : 'Initials fallback active. Upload a display photo for your profile.';

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateMediaFile(file, 'avatar');

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setIsReadingFile(true);

    void (async () => {
      try {
        const dataUrl = await readFileAsDataUrl(file);

        await persistMediaImage({
          kind: 'avatar',
          owner,
          file,
          dataUrl,
          isApiAvailable: isPreferencesApiAvailable('member'),
          onSaved: saveSelfAvatarOverride,
          onLocalFallback: saveSelfAvatarOverride,
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
      } finally {
        setIsReadingFile(false);
      }
    })();
  }

  function removeAvatar(): void {
    setErrorMessage(null);
    clearSelfAvatarOverride();
  }

  return (
    <article className="media-upload-prep-card member-avatar-upload-card" id="member-avatar-upload">
      <div className="media-upload-prep-copy">
        <span className="media-upload-prep-eyebrow">My Profile media</span>
        <strong>Profile avatar</strong>
        <small>{currentState}</small>
      </div>

      <div className="media-upload-prep-details">
        <span>{MEDIA_UPLOAD_ACCEPTED_LABEL}</span>
        <span>{storageHint}</span>
      </div>

      <input
        accept="image/png,image/jpeg,image/webp"
        className="member-avatar-upload-input"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      <div className="member-avatar-upload-actions">
        <button
          className="nami-surface-button is-primary-surface-button"
          disabled={isReadingFile}
          onClick={openFilePicker}
          type="button"
        >
          {isReadingFile ? 'Uploading image…' : 'Upload display photo'}
        </button>

        {hasCustomAvatar || member.avatarImageUrl ? (
          <button className="nami-surface-button" onClick={removeAvatar} type="button">
            Remove photo
          </button>
        ) : null}
      </div>

      {errorMessage ? <p className="member-avatar-upload-error">{errorMessage}</p> : null}

      <p>Your display photo updates passports, chat avatars, and the top-right profile card.</p>
    </article>
  );
}
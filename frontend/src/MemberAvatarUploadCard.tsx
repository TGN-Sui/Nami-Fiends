import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  clearSelfAvatarOverride,
  readSelfAvatarOverride,
  saveSelfAvatarOverride,
  useSelfMember,
} from './member-avatar-store.js';

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatAcceptedTypes(): string {
  return 'PNG, JPG, WebP';
}

export function MemberAvatarUploadCard(): ReactElement {
  const member = useSelfMember();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const override = readSelfAvatarOverride();
  const hasCustomAvatar = override !== null && override.length > 0;
  const currentState = hasCustomAvatar
    ? 'Custom display photo active across Nami.'
    : member.avatarImageUrl
      ? 'Default demo avatar active. Upload to replace it site-wide.'
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

    if (!ACCEPTED_TYPES.has(file.type)) {
      setErrorMessage('Use a PNG, JPG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setErrorMessage('Image must be 2 MB or smaller.');
      return;
    }

    setErrorMessage(null);
    setIsReadingFile(true);

    const reader = new FileReader();

    reader.onload = () => {
      setIsReadingFile(false);

      if (typeof reader.result !== 'string') {
        setErrorMessage('Could not read that image. Try another file.');
        return;
      }

      saveSelfAvatarOverride(reader.result);
    };

    reader.onerror = () => {
      setIsReadingFile(false);
      setErrorMessage('Could not read that image. Try another file.');
    };

    reader.readAsDataURL(file);
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
        <span>{formatAcceptedTypes()}</span>
        <span>Stored locally for this demo session</span>
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
          {isReadingFile ? 'Reading image…' : 'Upload display photo'}
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
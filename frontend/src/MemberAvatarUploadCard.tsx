import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  isMemberPreferencesApiAvailable,
  uploadAvatarToBackend,
} from './member-preferences-api.js';
import {
  clearSelfAvatarOverride,
  readSelfAvatarOverride,
  saveSelfAvatarOverride,
  useSelfMember,
} from './member-avatar-store.js';
import { useProtocolOwner } from './wallet.js';

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatAcceptedTypes(): string {
  return 'PNG, JPG, WebP';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read image.'));
        return;
      }

      const commaIndex = reader.result.indexOf(',');

      if (commaIndex < 0) {
        reject(new Error('Could not read image.'));
        return;
      }

      resolve(reader.result.slice(commaIndex + 1));
    };

    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
}

export function MemberAvatarUploadCard(): ReactElement {
  const member = useSelfMember();
  const { owner } = useProtocolOwner();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const override = readSelfAvatarOverride();
  const hasCustomAvatar = override !== null && override.length > 0;
  const storageHint = isMemberPreferencesApiAvailable()
    ? 'Synced to the receiving server for this wallet.'
    : 'Stored locally until the backend API is available.';
  const currentState = hasCustomAvatar
    ? 'Custom display photo active across Nami.'
    : member.avatarImageUrl
      ? 'Default demo avatar active. Upload to replace it site-wide.'
      : 'Initials fallback active. Upload a display photo for your profile.';

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  async function persistAvatar(file: File, dataUrl: string): Promise<void> {
    if (isMemberPreferencesApiAvailable() && owner?.startsWith('0x')) {
      const dataBase64 = await fileToBase64(file);
      const uploaded = await uploadAvatarToBackend({
        owner,
        contentType: file.type,
        dataBase64,
      });

      if (uploaded?.url) {
        saveSelfAvatarOverride(uploaded.url);
        return;
      }
    }

    saveSelfAvatarOverride(dataUrl);
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
      void (async () => {
        try {
          if (typeof reader.result !== 'string') {
            setErrorMessage('Could not read that image. Try another file.');
            return;
          }

          await persistAvatar(file, reader.result);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
        } finally {
          setIsReadingFile(false);
        }
      })();
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
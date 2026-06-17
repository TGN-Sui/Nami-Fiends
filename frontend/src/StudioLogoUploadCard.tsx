import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  fetchStudioPreferences,
  isStudioPreferencesApiAvailable,
  uploadStudioLogoToBackend,
} from './studio-preferences-api.js';
import {
  clearStudioLogoOverride,
  hydrateStudioLogoOverride,
  readStudioLogoOverride,
  resolveStudioLogoUrl,
  saveStudioLogoOverride,
} from './studio-logo-store.js';
import { type NamiDeveloperProfile } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_BYTES = 2 * 1024 * 1024;

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

export function StudioLogoUploadCard(props: { developer: NamiDeveloperProfile }): ReactElement {
  const { owner } = useProtocolOwner();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const override = readStudioLogoOverride(props.developer.id);
  const activeLogo = resolveStudioLogoUrl(props.developer);
  const hasCustomLogo = override !== null && override.length > 0;
  const storageHint = isStudioPreferencesApiAvailable()
    ? 'Synced to the receiving server for this studio owner wallet.'
    : 'Stored locally until the backend API is available.';

  useEffect(() => {
    if (!isStudioPreferencesApiAvailable()) {
      return;
    }

    void fetchStudioPreferences(props.developer.id)
      .then((preferences) => {
        if (preferences?.logoUrl) {
          hydrateStudioLogoOverride(props.developer.id, preferences.logoUrl);
        }
      })
      .catch(() => {
        // Studio preference hydration is best-effort.
      });
  }, [props.developer.id]);

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  async function persistLogo(file: File, dataUrl: string): Promise<void> {
    if (isStudioPreferencesApiAvailable() && owner?.startsWith('0x')) {
      const dataBase64 = await fileToBase64(file);
      const uploaded = await uploadStudioLogoToBackend({
        owner,
        studioId: props.developer.id,
        contentType: file.type,
        dataBase64,
      });

      if (uploaded?.url) {
        saveStudioLogoOverride(props.developer.id, uploaded.url);
        return;
      }
    }

    saveStudioLogoOverride(props.developer.id, dataUrl);
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
      setErrorMessage('Logo must be 2 MB or smaller.');
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

          await persistLogo(file, reader.result);
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

  function removeLogo(): void {
    setErrorMessage(null);
    clearStudioLogoOverride(props.developer.id);
  }

  return (
    <article className="media-upload-prep-card studio-logo-upload-card">
      <div className="media-upload-prep-copy">
        <span className="media-upload-prep-eyebrow">Studio media</span>
        <strong>Studio logo</strong>
        <small>
          {hasCustomLogo
            ? 'Custom studio logo active across studio surfaces.'
            : activeLogo
              ? 'Demo studio logo active. Upload to replace it site-wide.'
              : 'Logo seed fallback active. Upload a studio logo for this profile.'}
        </small>
      </div>

      {activeLogo ? (
        <div
          className="studio-logo-upload-preview"
          style={{ backgroundImage: 'url(' + JSON.stringify(activeLogo) + ')' }}
        />
      ) : null}

      <div className="media-upload-prep-details">
        <span>PNG, JPG, WebP</span>
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
          {isReadingFile ? 'Uploading logo…' : 'Upload studio logo'}
        </button>

        {hasCustomLogo || activeLogo ? (
          <button className="nami-surface-button" onClick={removeLogo} type="button">
            Remove logo
          </button>
        ) : null}
      </div>

      {errorMessage ? <p className="member-avatar-upload-error">{errorMessage}</p> : null}

      <p>Studio logos update Game Hub cards, studio hero marks, and developer profile surfaces.</p>
    </article>
  );
}
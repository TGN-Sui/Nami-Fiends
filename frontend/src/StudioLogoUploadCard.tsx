import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  MEDIA_UPLOAD_ACCEPTED_LABEL,
  persistMediaImage,
  readFileAsDataUrl,
  validateMediaFile,
} from './media-upload-service.js';
import {
  clearStudioLogoOverride,
  readStudioLogoOverride,
  resolveStudioLogoUrl,
  saveStudioLogoOverride,
} from './studio-logo-store.js';
import {
  hydrateStudioLogoPreference,
  isPreferencesApiAvailable,
  preferencesStorageHint,
} from './preferences-sync.js';
import { type NamiDeveloperProfile } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

export function StudioLogoUploadCard(props: { developer: NamiDeveloperProfile }): ReactElement {
  const { owner } = useProtocolOwner();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const override = readStudioLogoOverride(props.developer.id);
  const activeLogo = resolveStudioLogoUrl(props.developer);
  const hasCustomLogo = override !== null && override.length > 0;

  useEffect(() => {
    void hydrateStudioLogoPreference(props.developer.id);
  }, [props.developer.id]);

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateMediaFile(file, 'studio-logo');

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
          kind: 'studio-logo',
          owner,
          file,
          dataUrl,
          studioId: props.developer.id,
          isApiAvailable: isPreferencesApiAvailable('studio'),
          onSaved: (url) => saveStudioLogoOverride(props.developer.id, url),
          onLocalFallback: (url) => saveStudioLogoOverride(props.developer.id, url),
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
      } finally {
        setIsReadingFile(false);
      }
    })();
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
              ? 'Default studio logo active. Upload to replace it site-wide.'
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
        <span>{MEDIA_UPLOAD_ACCEPTED_LABEL}</span>
        <span>{preferencesStorageHint('studio')}</span>
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
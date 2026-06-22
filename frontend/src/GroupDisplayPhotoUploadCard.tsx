import { useState, type ReactElement } from 'react';

import {
  clearGroupDisplayPhoto,
  readGroupDisplayPhoto,
  resolveGroupDisplayPhotoUrl,
  saveGroupDisplayPhoto,
  type GroupDisplayPhotoKind,
} from './group-display-photo-store.js';
import { readFileAsDataUrl, validateMediaFile } from './media-upload-service.js';
import { OwnerMediaUploadField } from './OwnerMediaUploadField.js';
import type { OwnerMediaSlot } from './owner-media-specs.js';

export function GroupDisplayPhotoUploadCard(props: {
  groupId: string;
  groupName: string;
  kind: GroupDisplayPhotoKind;
  canEdit: boolean;
}): ReactElement | null {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);

  if (!props.canEdit) {
    return null;
  }

  const activePhoto = resolveGroupDisplayPhotoUrl(props.kind, props.groupId);
  const hasUpload = readGroupDisplayPhoto(props.kind, props.groupId) !== null;
  const groupLabel = props.kind === 'guild' ? 'Guild' : 'Squad';
  const uploadSlot: OwnerMediaSlot =
    props.kind === 'guild' ? 'guild-display-photo' : 'squad-display-photo';

  function handleUpload(dataUrl: string, file: File): void {
    setErrorMessage(null);
    setIsReadingFile(true);

    void (async () => {
      try {
        const validationError = validateMediaFile(file, 'channel-cover');

        if (validationError) {
          setErrorMessage(validationError);
          return;
        }

        const normalized = dataUrl || (await readFileAsDataUrl(file));
        saveGroupDisplayPhoto(props.kind, props.groupId, normalized);
        setNotice(groupLabel + ' display photo updated.');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
      } finally {
        setIsReadingFile(false);
      }
    })();
  }

  return (
    <article className="panel channel-owner-tool-card group-display-photo-upload-card">
      <div className="channel-owner-tool-card-head">
        <div>
          <span className="mini-badge">{groupLabel} media</span>
          <h3>Display photo</h3>
          <p>
            {hasUpload
              ? 'Members see this photo on passports, profiles, and group cards.'
              : 'Upload a display photo for ' + props.groupName + '.'}
          </p>
        </div>
      </div>

      <OwnerMediaUploadField
        notice={notice || errorMessage}
        onRemove={() => {
          setErrorMessage(null);
          clearGroupDisplayPhoto(props.kind, props.groupId);
          setNotice(groupLabel + ' display photo removed.');
        }}
        onUpload={(dataUrl, file) => handleUpload(dataUrl, file)}
        previewUrl={activePhoto ?? null}
        slot={uploadSlot}
        uploadLabel={isReadingFile ? 'Uploading photo…' : 'Upload display photo'}
      />

      <small className="channel-owner-tool-footnote">
        Saved on this device for demo wiring. Visible to all members browsing groups.
      </small>
    </article>
  );
}
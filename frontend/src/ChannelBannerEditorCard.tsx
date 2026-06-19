import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { ChannelBannerOwnerPreviewOverlay } from './ChannelBannerOwnerPreviewOverlay.js';
import {
  publishChannelBannerAlertForOwner,
  readChannelBannerContent,
  saveChannelBannerContent,
} from './channel-banner-notifications-store.js';
import {
  MEDIA_UPLOAD_ACCEPTED_LABEL,
  readFileAsDataUrl,
  validateMediaFile,
} from './media-upload-service.js';
import { type NamiChannel } from './uiMockData.js';

type BannerPreviewDraft = {
  coverUrl: string;
  headline: string;
  body: string;
};

export function ChannelBannerEditorCard(props: {
  channel: NamiChannel;
  isEliteOwner: boolean;
}): ReactElement {
  const initialContent = readChannelBannerContent(props.channel.id, props.channel);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [headline, setHeadline] = useState(initialContent.headline);
  const [body, setBody] = useState(initialContent.body);
  const [coverUrl, setCoverUrl] = useState(initialContent.coverUrl);
  const [notice, setNotice] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<BannerPreviewDraft | null>(null);

  if (!props.isEliteOwner) {
    return (
      <article className="media-upload-prep-card channel-banner-editor-card is-locked-banner-editor">
        <div className="media-upload-prep-copy">
          <span className="media-upload-prep-eyebrow">Focused banner alerts</span>
          <strong>Banner editor locked</strong>
          <small>Elite channel owners can edit banner cover and copy for Get Banners subscribers.</small>
        </div>
      </article>
    );
  }

  function readResolvedDraft(): BannerPreviewDraft {
    return {
      coverUrl,
      headline: headline.trim() || props.channel.name,
      body: body.trim() || props.channel.tagline,
    };
  }

  function persistDraft(): void {
    const draft = readResolvedDraft();

    saveChannelBannerContent(props.channel.id, {
      ...draft,
      updatedAtMs: Date.now(),
    });
  }

  function handleSave(): void {
    persistDraft();
    setNotice('Banner draft saved for ' + props.channel.name + '.');
  }

  function handlePreview(): void {
    persistDraft();
    setPreviewDraft(readResolvedDraft());
    setNotice('');
  }

  function handleSendFromPreview(): void {
    persistDraft();
    const published = publishChannelBannerAlertForOwner(props.channel.id);

    setPreviewDraft(null);
    setNotice(
      published
        ? 'Banner alert sent to Get Banners subscribers (simulated locally).'
        : 'Could not send this banner alert.',
    );
  }

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateMediaFile(file, 'channel-cover');

    if (validationError) {
      setNotice(validationError);
      return;
    }

    setIsReadingFile(true);

    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        setCoverUrl(dataUrl);
        setNotice('Banner cover updated.');
      })
      .catch((error: unknown) => {
        setNotice(error instanceof Error ? error.message : 'Could not read image.');
      })
      .finally(() => {
        setIsReadingFile(false);
      });
  }

  return (
    <>
      <article className="panel channel-owner-tool-card channel-banner-editor-card channel-banner-editor-compact">
        <div className="channel-owner-tool-card-head">
          <div>
            <span className="mini-badge">Focused alert</span>
            <h3>Banner alerts panel</h3>
            <p>Compact editor for Get Banners subscribers — preview before you publish.</p>
          </div>
        </div>

        <div className="channel-banner-editor-compact-grid">
          <div
            className={'channel-banner-editor-preview channel-banner-editor-preview-compact' + (coverUrl ? ' has-banner-cover' : '')}
            style={coverUrl ? { backgroundImage: 'url(' + JSON.stringify(coverUrl) + ')' } : undefined}
          >
            <div className="channel-banner-editor-preview-overlay">
              <strong>{headline || props.channel.name}</strong>
              <p>{body || props.channel.tagline}</p>
            </div>
          </div>

          <div className="channel-banner-editor-fields-stack">
            <label className="channel-banner-editor-field">
              <span>Headline</span>
              <input
                onChange={(event) => setHeadline(event.target.value)}
                type="text"
                value={headline}
              />
            </label>

            <label className="channel-banner-editor-field">
              <span>Banner message</span>
              <textarea onChange={(event) => setBody(event.target.value)} rows={3} value={body} />
            </label>

            <small className="channel-owner-tool-footnote">{MEDIA_UPLOAD_ACCEPTED_LABEL}</small>

            <input
              accept="image/png,image/jpeg,image/webp"
              className="member-avatar-upload-input"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />

            <div className="channel-owner-tool-actions channel-banner-editor-actions">
              <button
                className="nami-surface-button"
                disabled={isReadingFile}
                onClick={openFilePicker}
                type="button"
              >
                {isReadingFile ? 'Reading…' : 'Upload cover'}
              </button>
              <button className="nami-surface-button" onClick={handleSave} type="button">
                Save draft
              </button>
              <button
                className="nami-surface-button is-primary-surface-button"
                onClick={handlePreview}
                type="button"
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {notice ? <p className="channel-owner-tool-notice is-success">{notice}</p> : null}
      </article>

      {previewDraft ? (
        <ChannelBannerOwnerPreviewOverlay
          body={previewDraft.body}
          channel={props.channel}
          coverUrl={previewDraft.coverUrl}
          headline={previewDraft.headline}
          onClose={() => setPreviewDraft(null)}
          onSend={handleSendFromPreview}
        />
      ) : null}
    </>
  );
}
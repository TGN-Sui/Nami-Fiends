import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { ChannelBannerOwnerPreviewOverlay } from './ChannelBannerOwnerPreviewOverlay.js';
import {
  publishChannelBannerAlertForOwner,
  readChannelBannerContent,
  saveChannelBannerContent,
  simulateChannelBannerBurst,
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

  function handleSimulateBurst(): void {
    persistDraft();
    const created = simulateChannelBannerBurst([props.channel.id]);

    setNotice(
      created.length > 0
        ? 'Simulated banner burst queued for review.'
        : 'Enable Get Banners on this channel to simulate the alert queue.',
    );
  }

  function handleSimulateAllSubscribed(): void {
    const created = simulateChannelBannerBurst();

    setNotice(
      created.length > 0
        ? 'Simulated ' + created.length + ' subscribed channel banners in the slowmode queue.'
        : 'No Get Banners subscriptions yet. Enable alerts on one or more channels first.',
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
      <article className="media-upload-prep-card channel-banner-editor-card">
        <div className="media-upload-prep-copy">
          <span className="media-upload-prep-eyebrow">Elite owner tools</span>
          <strong>Focused banner alert</strong>
          <small>
            Edit the cover and message subscribers see, preview the alert, then send when it looks right.
          </small>
        </div>

        <div
          className={'channel-banner-editor-preview' + (coverUrl ? ' has-banner-cover' : '')}
          style={coverUrl ? { backgroundImage: 'url(' + JSON.stringify(coverUrl) + ')' } : undefined}
        >
          <div className="channel-banner-editor-preview-overlay">
            <strong>{headline || props.channel.name}</strong>
            <p>{body || props.channel.tagline}</p>
          </div>
        </div>

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

        <div className="media-upload-prep-details">
          <span>{MEDIA_UPLOAD_ACCEPTED_LABEL}</span>
          <span>Banner cover uses the same image rules as channel covers.</span>
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
            className="nami-surface-button"
            disabled={isReadingFile}
            onClick={openFilePicker}
            type="button"
          >
            {isReadingFile ? 'Reading cover…' : 'Upload banner cover'}
          </button>
          <button className="nami-surface-button" onClick={handleSave} type="button">
            Save draft
          </button>
          <button
            className="nami-surface-button is-primary-surface-button"
            onClick={handlePreview}
            type="button"
          >
            Preview alert
          </button>
          <button className="nami-surface-button" onClick={handleSimulateBurst} type="button">
            Simulate burst
          </button>
          <button className="nami-surface-button" onClick={handleSimulateAllSubscribed} type="button">
            Simulate all subscribed
          </button>
        </div>

        {notice ? <p className="member-avatar-upload-error">{notice}</p> : null}
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
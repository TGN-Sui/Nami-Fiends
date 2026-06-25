import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { BannerShoutoutBadge } from './BannerShoutoutBadge.js';
import { ChannelBannerOwnerPreviewOverlay } from './ChannelBannerOwnerPreviewOverlay.js';
import { resolveBannerShoutoutMember } from './channel-banner-shoutout.js';
import { useChannelOwnerSettings } from './channel-owner-settings-context.js';
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
import {
  isPreApprovedGameOwnerWorkspace,
  preApprovedOwnerRestrictionMessage,
} from './game-owner-approval-guards.js';
import { ownerMediaDimensionNote } from './owner-media-specs.js';
import { PreApprovedGameOwnerLockedPanel } from './PreApprovedGameOwnerLockedPanel.js';
import { members, type NamiChannel } from './uiMockData.js';

type BannerPreviewDraft = {
  coverUrl: string;
  headline: string;
  body: string;
  shoutoutMemberId: string | null;
};

export function ChannelBannerEditorCard(props: { channel: NamiChannel }): ReactElement {
  const settings = useChannelOwnerSettings();
  const initialContent = readChannelBannerContent(props.channel.id, props.channel);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [coverUrl, setCoverUrl] = useState(initialContent.coverUrl);
  const [notice, setNotice] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<BannerPreviewDraft | null>(null);
  const sendLocked = isPreApprovedGameOwnerWorkspace(props.channel.id);
  const headline = settings.draft.bannerEditor.headline;
  const body = settings.draft.bannerEditor.body;
  const shoutoutMemberId = settings.draft.bannerEditor.shoutoutMemberId;
  const shoutout = resolveBannerShoutoutMember(shoutoutMemberId);
  const shoutoutCandidates = members.filter((member) => member.surfaceType === 'member');

  function readResolvedDraft(): BannerPreviewDraft {
    return {
      coverUrl,
      headline: headline.trim() || props.channel.name,
      body: body.trim() || props.channel.tagline,
      shoutoutMemberId: shoutout?.memberId ?? null,
    };
  }

  function persistCover(nextCoverUrl: string): void {
    const draft = readResolvedDraft();

    saveChannelBannerContent(props.channel.id, {
      ...draft,
      coverUrl: nextCoverUrl,
      updatedAtMs: Date.now(),
    });
  }

  function handlePreview(): void {
    settings.saveSettings();
    setPreviewDraft(readResolvedDraft());
    setNotice('');
  }

  function handleSendFromPreview(): void {
    if (sendLocked) {
      setNotice(preApprovedOwnerRestrictionMessage('Sending banner alerts'));
      return;
    }

    settings.saveSettings();
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
        persistCover(dataUrl);
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
            <p>
              Compact editor for Get Banners subscribers — preview before you publish.{' '}
              {ownerMediaDimensionNote('focused-banner-cover')}
            </p>
            {sendLocked ? (
              <p className="protocol-hint">
                Upload covers and save drafts now. Sending to subscribers unlocks after full approval.
              </p>
            ) : null}
          </div>
        </div>

        {sendLocked ? (
          <PreApprovedGameOwnerLockedPanel compact feature="Sending banner alerts" />
        ) : null}

        <div className="channel-banner-editor-compact-grid">
          <div
            className={'channel-banner-editor-preview channel-banner-editor-preview-compact' + (coverUrl ? ' has-banner-cover' : '')}
            style={coverUrl ? { backgroundImage: 'url(' + JSON.stringify(coverUrl) + ')' } : undefined}
          >
            <div className="channel-banner-editor-preview-overlay">
              {shoutout ? <BannerShoutoutBadge shoutout={shoutout} /> : null}
              <strong>{headline || props.channel.name}</strong>
              <p>{body || props.channel.tagline}</p>
            </div>
          </div>

          <div className="channel-banner-editor-fields-stack">
            <label className="channel-banner-editor-field">
              <span>Headline</span>
              <input
                onChange={(event) => settings.updateBannerEditor({ headline: event.target.value })}
                type="text"
                value={headline}
              />
            </label>

            <label className="channel-banner-editor-field">
              <span>Banner message</span>
              <textarea
                onChange={(event) => settings.updateBannerEditor({ body: event.target.value })}
                rows={3}
                value={body}
              />
            </label>

            <label className="channel-banner-editor-field">
              <span>Member shoutout</span>
              <select
                onChange={(event) => {
                  const nextMemberId = event.target.value || null;

                  settings.updateBannerEditor({ shoutoutMemberId: nextMemberId });
                }}
                value={shoutoutMemberId ?? ''}
              >
                <option value="">No tagged member</option>
                {shoutoutCandidates.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
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
              <button
                className="nami-surface-button is-primary-surface-button"
                onClick={handlePreview}
                type="button"
              >
                Preview
              </button>
            </div>

            <p className="channel-owner-tool-footnote">
              Headline and message save with Save settings below.
            </p>
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
          shoutoutMemberId={previewDraft.shoutoutMemberId}
          onClose={() => setPreviewDraft(null)}
          onSend={handleSendFromPreview}
          sendLocked={sendLocked}
          {...(sendLocked
            ? { sendLockedReason: preApprovedOwnerRestrictionMessage('Sending banner alerts') }
            : {})}
        />
      ) : null}
    </>
  );
}
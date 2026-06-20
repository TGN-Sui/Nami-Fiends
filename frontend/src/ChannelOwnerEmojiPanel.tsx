import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  addChannelCustomEmojisBatch,
  CHANNEL_EMOJI_ACCEPTED_FORMATS,
  CHANNEL_EMOJI_MAX_COUNT,
  emojiShortcodeToken,
  normalizeEmojiShortcode,
  removeChannelCustomEmoji,
  suggestEmojiShortcodeFromLabel,
  useChannelCustomEmojis,
  validateEmojiUploadFile,
} from './channel-custom-emojis-store.js';
import { isPreApprovedGameOwnerWorkspace } from './game-owner-approval-guards.js';
import { PreApprovedGameOwnerLockedPanel } from './PreApprovedGameOwnerLockedPanel.js';
import type { NamiChannel } from './uiMockData.js';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Could not read that image.'));
    };

    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

function uniqueShortcode(base: string, used: Set<string>): string {
  const normalized = normalizeEmojiShortcode(base) || 'emoji';
  let candidate = normalized;
  let suffix = 2;

  while (used.has(candidate)) {
    candidate = normalized + '-' + String(suffix);
    suffix += 1;
  }

  used.add(candidate);
  return candidate;
}

export function ChannelOwnerEmojiPanel(props: { channel: NamiChannel }): ReactElement {
  const emojis = useChannelCustomEmojis(props.channel.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [label, setLabel] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const libraryFull = emojis.length >= CHANNEL_EMOJI_MAX_COUNT;
  const uploadsLocked = isPreApprovedGameOwnerWorkspace(props.channel.id);

  function clearMessages(): void {
    setNotice(null);
    setError(null);
  }

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    clearMessages();
    setIsReadingFile(true);

    const usedShortcodes = new Set(emojis.map((emoji) => emoji.shortcode));
    const prepared: Array<{ label: string; shortcode: string; imageUrl: string }> = [];
    const readErrors: string[] = [];

    for (const file of files) {
      const validationError = validateEmojiUploadFile(file);

      if (validationError) {
        readErrors.push(file.name + ': ' + validationError);
        continue;
      }

      try {
        const imageUrl = await readFileAsDataUrl(file);
        const baseLabel = label.trim() || file.name.replace(/\.[^.]+$/, '');
        const baseShortcode =
          files.length === 1 && shortcode.trim()
            ? normalizeEmojiShortcode(shortcode)
            : suggestEmojiShortcodeFromLabel(file.name);

        prepared.push({
          label: baseLabel,
          shortcode: uniqueShortcode(baseShortcode, usedShortcodes),
          imageUrl,
        });
      } catch (readError) {
        readErrors.push(
          file.name + ': ' + (readError instanceof Error ? readError.message : 'Read failed.'),
        );
      }
    }

    setIsReadingFile(false);

    if (prepared.length === 0) {
      setError(readErrors[0] ?? 'No emoji images were uploaded.');
      return;
    }

    const { uploaded, errors } = addChannelCustomEmojisBatch({
      channelId: props.channel.id,
      items: prepared,
    });

    if (uploaded.length > 0) {
      setLabel('');
      setShortcode('');
      setNotice(
        uploaded.length === 1
          ? 'Uploaded :' +
              uploaded[0]!.shortcode +
              ': — visible in ' +
              props.channel.name +
              ' chat and matching genre lounges.'
          : 'Uploaded ' + String(uploaded.length) + ' channel emojis.',
      );
    }

    const combinedErrors = [...readErrors, ...errors];

    if (combinedErrors.length > 0) {
      setError(combinedErrors.slice(0, 3).join(' '));
    }
  }

  if (uploadsLocked) {
    return (
      <article className="panel channel-owner-tool-card channel-owner-emoji-panel is-preapproved-locked">
        <div className="channel-owner-tool-card-head">
          <div>
            <span className="mini-badge">Channel chat</span>
            <h3>Channel emojis</h3>
            <p>
              Upload emojis for {props.channel.name} chat and genre lounges tagged with{' '}
              {props.channel.genre}. They do not appear in other game channels.
            </p>
          </div>
        </div>
        <PreApprovedGameOwnerLockedPanel feature="Channel emoji uploads" />
      </article>
    );
  }

  return (
    <article className="panel channel-owner-tool-card channel-owner-emoji-panel">
      <div className="channel-owner-tool-card-head">
        <div>
          <span className="mini-badge">Channel chat</span>
          <h3>Channel emojis</h3>
          <p>
            Upload emojis for {props.channel.name} chat and genre lounges tagged with{' '}
            {props.channel.genre}. They do not appear in other game channels.
          </p>
        </div>
        <span className="channel-owner-tool-status-pill">
          {emojis.length} / {CHANNEL_EMOJI_MAX_COUNT}
        </span>
      </div>

      <div className="channel-owner-emoji-upload-form">
        <label className="channel-owner-tool-field">
          <span>Display label (optional)</span>
          <input onChange={(event) => setLabel(event.target.value)} value={label} />
        </label>

        <label className="channel-owner-tool-field">
          <span>Shortcode (optional)</span>
          <input
            onChange={(event) => setShortcode(normalizeEmojiShortcode(event.target.value))}
            placeholder="pebble-wave"
            value={shortcode}
          />
        </label>

        <small className="channel-owner-tool-footnote">
          {CHANNEL_EMOJI_ACCEPTED_FORMATS}. Max 512 KB per emoji.
        </small>

        <input
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="member-avatar-upload-input"
          multiple
          onChange={(event) => {
            void handleFileChange(event);
          }}
          ref={fileInputRef}
          type="file"
        />

        <div className="channel-owner-tool-actions">
          <button
            className="nami-surface-button"
            disabled={isReadingFile || libraryFull}
            onClick={openFilePicker}
            type="button"
          >
            {isReadingFile ? 'Reading images…' : libraryFull ? 'Library full' : 'Upload channel emojis'}
          </button>
        </div>
      </div>

      {notice ? <p className="channel-owner-tool-notice is-success">{notice}</p> : null}
      {error ? <p className="channel-owner-tool-notice is-error">{error}</p> : null}

      <div className="channel-owner-emoji-tile-grid">
        {emojis.length === 0 ? (
          <p className="channel-owner-tool-footnote">No channel emojis yet.</p>
        ) : (
          emojis.map((emoji) => (
            <article className="channel-owner-emoji-tile" key={emoji.id}>
              <img alt={emoji.label} className="nami-custom-emoji-image" src={emoji.imageUrl} />
              <div className="channel-owner-emoji-tile-copy">
                <strong>{emoji.label}</strong>
                <code>{emojiShortcodeToken(emoji.shortcode)}</code>
              </div>
              <button
                className="nami-surface-button"
                onClick={() => {
                  clearMessages();
                  if (removeChannelCustomEmoji(props.channel.id, emoji.id)) {
                    setNotice('Emoji removed.');
                  }
                }}
                type="button"
              >
                Remove
              </button>
            </article>
          ))
        )}
      </div>
    </article>
  );
}
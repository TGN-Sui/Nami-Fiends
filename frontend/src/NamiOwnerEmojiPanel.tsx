import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { canManageCustomEmojis } from './nami-capabilities.js';
import {
  addNamiCustomEmojisBatch,
  emojiShortcodeToken,
  NAMI_EMOJI_ACCEPTED_FORMATS,
  NAMI_EMOJI_MAX_COUNT,
  normalizeEmojiShortcode,
  removeNamiCustomEmoji,
  suggestEmojiShortcodeFromLabel,
  useNamiCustomEmojis,
  validateEmojiUploadFile,
} from './nami-custom-emojis-store.js';
import { useProtocolOwner } from './wallet.js';

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

export function NamiOwnerEmojiPanel(props: { embedded?: boolean } = {}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const emojis = useNamiCustomEmojis();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [label, setLabel] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  if (!canManageCustomEmojis(owner)) {
    return null;
  }

  const libraryFull = emojis.length >= NAMI_EMOJI_MAX_COUNT;

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
    const prepared: Array<{ label: string; shortcode: string; imageUrl: string; fileName: string }> =
      [];
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
          fileName: file.name,
        });
      } catch (readError) {
        readErrors.push(
          file.name + ': ' + (readError instanceof Error ? readError.message : 'Read failed.')
        );
      }
    }

    setIsReadingFile(false);

    if (prepared.length === 0) {
      setError(readErrors[0] ?? 'No emoji images were uploaded.');
      return;
    }

    const { uploaded, errors } = addNamiCustomEmojisBatch({
      actorOwner: owner,
      items: prepared.map((entry) => ({
        label: entry.label,
        shortcode: entry.shortcode,
        imageUrl: entry.imageUrl,
      })),
    });

    if (uploaded.length > 0) {
      setLabel('');
      setShortcode('');
      setNotice(
        uploaded.length === 1
          ? 'Uploaded :' +
              uploaded[0]!.shortcode +
              ': — all members can insert it from chat emoji pickers.'
          : 'Uploaded ' +
              String(uploaded.length) +
              ' emojis — all members can use them from chat emoji pickers.'
      );
    }

    const combinedErrors = [...readErrors, ...errors];

    if (combinedErrors.length > 0) {
      setError(combinedErrors.slice(0, 3).join(' '));
    }
  }

  function handleRemove(emojiId: string): void {
    clearMessages();

    if (!removeNamiCustomEmoji(emojiId, owner)) {
      setError('Could not remove that emoji.');
      return;
    }

    setNotice('Emoji removed from the shared picker.');
  }

  return (
    <section
      className={
        'panel settings-card nami-owner-emoji-panel' +
        (props.embedded ? ' nami-owner-advanced-embedded-panel' : '')
      }
    >
      {props.embedded ? null : (
        <div className="profile-panel-heading">
          <span className="mini-badge">Nami Official Owner</span>
          <h2>Chat Emoji Library</h2>
          <p>
            Upload custom emojis for every member. Only the Nami Official owner can add or remove
            images here. Members insert them as shortcodes like <code>:wave:</code> from the emoji
            picker beside chat composers.
          </p>
        </div>
      )}

      <div className="nami-owner-emoji-layout">
        <div className="nami-owner-emoji-upload-column">
          <div className="nami-owner-emoji-upload-form">
            <label className="member-profile-action-field">
              <span>Display label (optional for batch uploads)</span>
              <input
                aria-label="Emoji display label"
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Wave hello"
                value={label}
              />
            </label>

            <label className="member-profile-action-field">
              <span>Shortcode (optional — auto-generated per file when uploading many)</span>
              <input
                aria-label="Emoji shortcode"
                onChange={(event) => setShortcode(normalizeEmojiShortcode(event.target.value))}
                placeholder="wave"
                value={shortcode}
              />
            </label>

            <p className="nami-owner-emoji-hint">
              Accepted formats: {NAMI_EMOJI_ACCEPTED_FORMATS}. Max 512 KB per emoji. Upload one or
              many images at once.
            </p>

            <div className="nami-owner-emoji-upload-actions">
              <button
                className="primary-action"
                disabled={isReadingFile || libraryFull}
                onClick={openFilePicker}
                type="button"
              >
                {isReadingFile
                  ? 'Reading images…'
                  : libraryFull
                    ? 'Library full'
                    : 'Upload emoji images'}
              </button>
              <input
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                multiple
                onChange={(event) => {
                  void handleFileChange(event);
                }}
                ref={fileInputRef}
                type="file"
              />
            </div>
          </div>

          {notice ? <p className="member-profile-action-status">{notice}</p> : null}
          {error ? <p className="nami-owner-emoji-error">{error}</p> : null}
        </div>

        <div className="nami-owner-emoji-library">
          <div className="nami-owner-emoji-library-header">
            <div>
              <strong>Shared library</strong>
              <p>Members insert these from chat emoji pickers.</p>
            </div>
            <span className="nami-owner-emoji-count-badge">
              {emojis.length} / {NAMI_EMOJI_MAX_COUNT}
            </span>
          </div>

          <div className="nami-owner-emoji-tile-grid nami-owner-advanced-scroll-region" role="list">
            {emojis.length === 0 ? (
              <p className="nami-owner-emoji-empty">
                No custom emojis yet. Upload images to populate the picker.
              </p>
            ) : (
              emojis.map((emoji) => (
                <article className="nami-owner-emoji-tile" key={emoji.id} role="listitem">
                  <div className="nami-owner-emoji-tile-preview">
                    <img
                      alt={emoji.label}
                      className="nami-custom-emoji-image nami-owner-emoji-tile-image"
                      src={emoji.imageUrl}
                    />
                  </div>
                  <div className="nami-owner-emoji-tile-copy">
                    <strong title={emoji.label}>{emoji.label}</strong>
                    <code>{emojiShortcodeToken(emoji.shortcode)}</code>
                  </div>
                  <button
                    aria-label={'Remove ' + emoji.label}
                    className="nami-owner-emoji-remove-btn"
                    onClick={() => handleRemove(emoji.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
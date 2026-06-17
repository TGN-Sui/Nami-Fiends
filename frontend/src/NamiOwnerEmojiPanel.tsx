import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import {
  addNamiCustomEmoji,
  emojiShortcodeToken,
  NAMI_EMOJI_ACCEPTED_FORMATS,
  normalizeEmojiShortcode,
  removeNamiCustomEmoji,
  suggestEmojiShortcodeFromLabel,
  useNamiCustomEmojis,
  validateEmojiUploadFile,
} from './nami-custom-emojis-store.js';
import { useProtocolOwner } from './wallet.js';

export function NamiOwnerEmojiPanel(): ReactElement | null {
  const { owner } = useProtocolOwner();
  const emojis = useNamiCustomEmojis();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [label, setLabel] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  if (!isOfficialOwner(owner)) {
    return null;
  }

  function clearMessages(): void {
    setNotice(null);
    setError(null);
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

    clearMessages();

    const validationError = validateEmojiUploadFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    const nextLabel = label.trim() || file.name.replace(/\.[^.]+$/, '');
    const nextShortcode = shortcode.trim() || suggestEmojiShortcodeFromLabel(file.name);

    setIsReadingFile(true);

    const reader = new FileReader();

    reader.onload = () => {
      setIsReadingFile(false);

      if (typeof reader.result !== 'string') {
        setError('Could not read that image. Try another file.');
        return;
      }

      const result = addNamiCustomEmoji({
        label: nextLabel,
        shortcode: nextShortcode,
        imageUrl: reader.result,
        actorOwner: owner,
      });

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setLabel('');
      setShortcode('');
      setNotice(
        'Uploaded :' +
          result.emoji.shortcode +
          ': — members can insert it from the emoji picker in chat.'
      );
    };

    reader.onerror = () => {
      setIsReadingFile(false);
      setError('Could not read that image. Try another file.');
    };

    reader.readAsDataURL(file);
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
    <section className="panel settings-card nami-owner-emoji-panel">
      <div className="profile-panel-heading">
        <span className="mini-badge">Nami Owner</span>
        <h2>Chat Emoji Library</h2>
        <p>
          Upload custom emojis for every chat composer. Members insert them as shortcodes like{' '}
          <code>:wave:</code> from the emoji picker beside the message field.
        </p>
      </div>

      <div className="nami-owner-emoji-upload-form">
        <label className="member-profile-action-field">
          <span>Display label</span>
          <input
            aria-label="Emoji display label"
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Wave hello"
            value={label}
          />
        </label>

        <label className="member-profile-action-field">
          <span>Shortcode</span>
          <input
            aria-label="Emoji shortcode"
            onChange={(event) => setShortcode(normalizeEmojiShortcode(event.target.value))}
            placeholder="wave"
            value={shortcode}
          />
        </label>

        <p className="nami-owner-emoji-hint">
          Accepted formats: {NAMI_EMOJI_ACCEPTED_FORMATS}. Max 512 KB per emoji.
        </p>

        <div className="nami-owner-emoji-upload-actions">
          <button
            className="primary-action"
            disabled={isReadingFile}
            onClick={openFilePicker}
            type="button"
          >
            {isReadingFile ? 'Reading image…' : 'Upload emoji image'}
          </button>
          <input
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
        </div>
      </div>

      {notice ? <p className="member-profile-action-status">{notice}</p> : null}
      {error ? <p className="nami-owner-emoji-error">{error}</p> : null}

      <div className="nami-owner-emoji-grid" role="list">
        {emojis.length === 0 ? (
          <p className="nami-owner-emoji-empty">No custom emojis yet. Upload images to populate the picker.</p>
        ) : (
          emojis.map((emoji) => (
            <article className="nami-owner-emoji-card" key={emoji.id} role="listitem">
              <img alt={emoji.label} className="nami-custom-emoji-image" src={emoji.imageUrl} />
              <div className="nami-owner-emoji-card-copy">
                <strong>{emoji.label}</strong>
                <code>{emojiShortcodeToken(emoji.shortcode)}</code>
              </div>
              <button
                className="secondary-action"
                onClick={() => handleRemove(emoji.id)}
                type="button"
              >
                Remove
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
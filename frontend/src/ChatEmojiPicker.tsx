import { useEffect, useRef, useState, type ReactElement } from 'react';

import { emojiShortcodeToken, useNamiCustomEmojis } from './nami-custom-emojis-store.js';

type ChatEmojiPickerProps = {
  disabled?: boolean;
  onSelect: (token: string) => void;
};

export function ChatEmojiPicker(props: ChatEmojiPickerProps): ReactElement | null {
  const emojis = useNamiCustomEmojis();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (emojis.length === 0) {
    return null;
  }

  function selectEmoji(shortcode: string): void {
    props.onSelect(emojiShortcodeToken(shortcode));
    setOpen(false);
  }

  return (
    <div className="chat-emoji-picker-root" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Insert emoji"
        className="chat-emoji-picker-toggle"
        disabled={props.disabled}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true">☺</span>
      </button>

      {open ? (
        <div className="chat-emoji-picker-popover" role="dialog" aria-label="Emoji picker">
          <div className="chat-emoji-picker-heading">
            <strong>Nami emojis</strong>
            <span>{emojis.length} available</span>
          </div>
          <div className="chat-emoji-picker-grid">
            {emojis.map((emoji) => (
              <button
                className="chat-emoji-picker-option"
                key={emoji.id}
                onClick={() => selectEmoji(emoji.shortcode)}
                title={emoji.label + ' (' + emojiShortcodeToken(emoji.shortcode) + ')'}
                type="button"
              >
                <img alt={emoji.label} className="nami-custom-emoji-image" src={emoji.imageUrl} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
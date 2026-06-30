import { useEffect, useRef, useState, type ReactElement } from 'react';

import { ChatComposerAnchorPopover } from './chat-composer-anchor-popover.js';
import { mergeQualifiedChatEmojis } from './chat-composer-emojis.js';
import { emojiShortcodeToken, useNamiCustomEmojis, type NamiCustomEmoji } from './nami-custom-emojis-store.js';

type ChatEmojiPickerProps = {
  disabled?: boolean;
  emojis?: NamiCustomEmoji[];
  pickerLabel?: string;
  onSelect: (token: string) => void;
};

export function ChatEmojiPicker(props: ChatEmojiPickerProps): ReactElement {
  useNamiCustomEmojis();
  const emojis = mergeQualifiedChatEmojis(props.emojis ?? []);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !(target instanceof Element && target.closest('.chat-emoji-picker-popover'))) {
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

  function selectEmoji(shortcode: string): void {
    if (props.disabled) {
      return;
    }

    props.onSelect(emojiShortcodeToken(shortcode));
    setOpen(false);
  }

  return (
    <div className="chat-emoji-picker-root" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Insert emoji"
        className={'chat-emoji-picker-toggle' + (open ? ' is-open-chat-emoji-picker' : '')}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true">☺</span>
      </button>

      <ChatComposerAnchorPopover
        anchorRef={rootRef}
        ariaLabel="Emoji picker"
        className="chat-emoji-picker-popover"
        open={open}
      >
        <div className="chat-emoji-picker-heading">
          <strong>{props.pickerLabel ?? 'Nami emojis'}</strong>
          <span>{emojis.length} available</span>
        </div>
        {emojis.length === 0 ? (
          <p className="chat-composer-picker-empty">No emojis are available in this chat yet.</p>
        ) : (
          <div className="chat-emoji-picker-grid">
            {emojis.map((emoji) => (
              <button
                className="chat-emoji-picker-option"
                disabled={props.disabled}
                key={emoji.id}
                onClick={() => selectEmoji(emoji.shortcode)}
                title={emoji.label + ' (' + emojiShortcodeToken(emoji.shortcode) + ')'}
                type="button"
              >
                <img alt={emoji.label} className="nami-custom-emoji-image" src={emoji.imageUrl} />
              </button>
            ))}
          </div>
        )}
        {props.disabled ? (
          <p className="chat-composer-picker-empty">Sign in and verify to insert emojis.</p>
        ) : null}
      </ChatComposerAnchorPopover>
    </div>
  );
}
import { useRef, type KeyboardEvent, type ReactElement } from 'react';

import { ChatEmojiPicker } from './ChatEmojiPicker.js';

type ChatComposerWithEmojisProps = {
  ariaLabel: string;
  canSend: boolean;
  className?: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  sendButtonClassName?: string;
  sendLabel?: string;
  value: string;
};

export function ChatComposerWithEmojis(props: ChatComposerWithEmojisProps): ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function insertEmojiToken(token: string): void {
    const input = inputRef.current;

    if (!input) {
      props.onChange(props.value + token);
      return;
    }

    const start = input.selectionStart ?? props.value.length;
    const end = input.selectionEnd ?? props.value.length;
    const nextValue = props.value.slice(0, start) + token + props.value.slice(end);

    props.onChange(nextValue);

    window.requestAnimationFrame(() => {
      const cursor = start + token.length;
      input.focus();
      input.setSelectionRange(cursor, cursor);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (props.canSend && props.value.trim()) {
        props.onSend();
      }
    }
  }

  return (
    <div className={'chat-composer-with-emojis' + (props.className ? ' ' + props.className : '')}>
      <ChatEmojiPicker disabled={!props.canSend} onSelect={insertEmojiToken} />
      <input
        aria-label={props.ariaLabel}
        disabled={!props.canSend}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder}
        ref={inputRef}
        value={props.value}
      />
      <button
        className={props.sendButtonClassName === undefined ? 'primary-action' : props.sendButtonClassName}
        disabled={!props.canSend || !props.value.trim()}
        onClick={props.onSend}
        type="button"
      >
        {props.sendLabel ?? 'Send'}
      </button>
    </div>
  );
}
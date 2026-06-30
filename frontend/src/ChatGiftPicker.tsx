import { useEffect, useRef, useState, type ReactElement } from 'react';

import { ChatComposerAnchorPopover } from './chat-composer-anchor-popover.js';
import { GiftSendPanel, type GiftSendTarget } from './GiftSendPanel.js';

type ChatGiftPickerProps = {
  target: GiftSendTarget;
};

export function ChatGiftPicker(props: ChatGiftPickerProps): ReactElement {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !(target instanceof Element && target.closest('.chat-gift-picker-popover'))) {
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

  return (
    <div className="chat-gift-picker-root" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Send gift"
        className={'chat-gift-picker-toggle' + (open ? ' is-open-chat-gift-picker' : '')}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true">🎁</span>
      </button>

      <ChatComposerAnchorPopover
        anchorRef={rootRef}
        ariaLabel={'Send gift to ' + props.target.targetMember.name}
        className="chat-gift-picker-popover"
        open={open}
      >
        <div className="chat-gift-picker-heading">
          <strong>Gifts for {props.target.targetMember.name}</strong>
          <button className="chat-gift-picker-close" onClick={() => setOpen(false)} type="button">
            Close
          </button>
        </div>
        <GiftSendPanel
          layout="composer-popover"
          onClose={() => setOpen(false)}
          onSent={() => setOpen(false)}
          target={props.target}
        />
      </ChatComposerAnchorPopover>
    </div>
  );
}
import { useCallback, useEffect, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function releaseExpandedChatScrollLock(): void {
  document.body.style.overflow = '';
  document.body.style.removeProperty('overflow');
}

type ExpandedChatOverlayProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  aside?: ReactNode;
  children: ReactNode;
  onEscape?: () => boolean | void;
};

export function ExpandedChatOverlay(props: ExpandedChatOverlayProps): ReactElement | null {
  const hasAside = props.aside !== undefined && props.aside !== null;
  const useSplitLayout = hasAside;

  const close = useCallback((): void => {
    releaseExpandedChatScrollLock();
    props.onClose();
  }, [props.onClose]);

  const handleEscape = props.onEscape;

  useEffect(() => {
    if (!props.open) {
      releaseExpandedChatScrollLock();
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        if (handleEscape?.() === true) {
          return;
        }

        close();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      releaseExpandedChatScrollLock();
    };
  }, [close, handleEscape, props.open]);

  if (!props.open) {
    return null;
  }

  const overlay = (
    <div
      className={
        'chat-window-expand-host is-chat-window-expanded' +
        (useSplitLayout ? ' is-chat-window-expand-split' : '')
      }
      role="dialog"
      aria-modal={true}
      aria-label={props.label}
    >
      <button
        aria-label="Close expanded chat"
        className="chat-window-expand-backdrop"
        onClick={close}
        type="button"
      />

      <div className="chat-window-expand-surface">
        {useSplitLayout ? (
          <div className="chat-window-expand-split-layout">
            <aside aria-label="Live broadcast" className="chat-window-expand-broadcast-aside">
              {props.aside}
            </aside>
            <div className="chat-window-expand-panel-slot">{props.children}</div>
          </div>
        ) : (
          <div className="chat-window-expand-panel-slot is-single-column">{props.children}</div>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
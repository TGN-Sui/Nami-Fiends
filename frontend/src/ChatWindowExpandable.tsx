import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ChatWindowExpandableProps = {
  className?: string;
  children: ReactNode;
  expandedAside?: ReactNode;
  onExpandedChange?: (expanded: boolean) => void;
  onEscape?: () => boolean | void;
};

export function ChatWindowExpandable(props: ChatWindowExpandableProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const hasExpandedAside = props.expandedAside !== undefined && props.expandedAside !== null;

  function setExpandedState(nextExpanded: boolean): void {
    setExpanded(nextExpanded);
    props.onExpandedChange?.(nextExpanded);
  }

  function openExpanded(): void {
    if (hostRef.current) {
      setPlaceholderHeight(hostRef.current.offsetHeight);
    }

    setExpandedState(true);
  }

  function closeExpanded(): void {
    setExpandedState(false);
  }

  useEffect(() => {
    if (!expanded) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        if (props.onEscape?.() === true) {
          return;
        }

        closeExpanded();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expanded, props.onEscape]);

  const articleClass =
    'chat-window chat-window-buildout' +
    (props.className ? ' ' + props.className : '') +
    (expanded ? ' is-chat-window-expanded-panel' : '');

  const expandedOverlay = (
    <div
      className={
        'chat-window-expand-host is-chat-window-expanded' +
        (hasExpandedAside ? ' is-chat-window-expand-split' : '')
      }
      role="dialog"
      aria-modal={true}
      aria-label={hasExpandedAside ? 'Expanded live chat and broadcast' : 'Expanded chat'}
    >
      <button
        aria-label="Close expanded chat"
        className="chat-window-expand-backdrop"
        onClick={closeExpanded}
        type="button"
      />

      {hasExpandedAside ? (
        <div className="chat-window-expand-split-layout">
          <aside aria-label="Live broadcast" className="chat-window-expand-broadcast-aside">
            {props.expandedAside}
          </aside>

          <article className={articleClass}>
            <button
              className="nami-surface-button chat-window-expand-toggle"
              onClick={closeExpanded}
              type="button"
            >
              Close
            </button>
            {props.children}
          </article>
        </div>
      ) : (
        <article className={articleClass}>
          <button
            className="nami-surface-button chat-window-expand-toggle"
            onClick={closeExpanded}
            type="button"
          >
            Close
          </button>
          {props.children}
        </article>
      )}
    </div>
  );

  return (
    <>
      {expanded ? (
        <div
          aria-hidden
          className="chat-window-expand-placeholder"
          style={{ height: placeholderHeight }}
        />
      ) : null}

      {!expanded ? (
        <div className="chat-window-expand-host" ref={hostRef}>
          <article className={articleClass}>
            <button
              className="nami-surface-button chat-window-expand-toggle"
              onClick={openExpanded}
              type="button"
            >
              Expand
            </button>
            {props.children}
          </article>
        </div>
      ) : (
        <div className="chat-window-expand-host" ref={hostRef} />
      )}

      {expanded ? createPortal(expandedOverlay, document.body) : null}
    </>
  );
}
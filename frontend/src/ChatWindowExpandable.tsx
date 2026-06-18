import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

import { ExpandedChatOverlay, releaseExpandedChatScrollLock } from './ExpandedChatOverlay.js';

type ChatWindowExpandableProps = {
  className?: string;
  children: ReactNode;
  expandedAside?: ReactNode;
  renderExpandedAside?: () => ReactNode;
  expandedNotice?: ReactNode;
  expandedHeading?: ReactNode;
  onExpandedChange?: (expanded: boolean) => void;
  onEscape?: () => boolean | void;
};

export function ChatWindowExpandable(props: ChatWindowExpandableProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const closeExpanded = useCallback((): void => {
    releaseExpandedChatScrollLock();
    setExpanded(false);
    props.onExpandedChange?.(false);
  }, [props.onExpandedChange]);

  function openExpanded(): void {
    if (hostRef.current) {
      setPlaceholderHeight(hostRef.current.offsetHeight);
    }

    setExpanded(true);
    props.onExpandedChange?.(true);
  }

  useEffect(() => {
    return () => {
      releaseExpandedChatScrollLock();
    };
  }, []);

  const articleClass =
    'chat-window chat-window-buildout' +
    (props.className ? ' ' + props.className : '') +
    ' is-chat-window-expanded-panel';

  const expandedAside =
    expanded && props.renderExpandedAside
      ? props.renderExpandedAside()
      : expanded
        ? props.expandedAside
        : undefined;

  const hasExpandedAside = expandedAside !== undefined && expandedAside !== null;
  const overlayLabel = hasExpandedAside ? 'Expanded live chat and broadcast' : 'Expanded chat';

  const expandedPanel = (
    <article className={articleClass}>
      <button
        aria-label="Close expanded chat"
        className="nami-surface-button chat-window-expand-toggle chat-window-expand-dismiss"
        onClick={closeExpanded}
        type="button"
      >
        Close
      </button>
      {props.expandedHeading ? (
        <div className="chat-window-expanded-heading">{props.expandedHeading}</div>
      ) : null}
      {props.expandedNotice ? (
        <div className="chat-window-expanded-notice">{props.expandedNotice}</div>
      ) : null}
      {props.children}
    </article>
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
          <article className={'chat-window chat-window-buildout' + (props.className ? ' ' + props.className : '')}>
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

      <ExpandedChatOverlay
        aside={hasExpandedAside ? expandedAside : undefined}
        label={overlayLabel}
        onClose={closeExpanded}
        {...(props.onEscape ? { onEscape: props.onEscape } : {})}
        open={expanded}
      >
        {expandedPanel}
      </ExpandedChatOverlay>
    </>
  );
}
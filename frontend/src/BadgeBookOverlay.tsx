import { useCallback, useEffect, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { badgeBookSpreadCssVars, type BadgeBookLiftTarget } from './badge-book-lift.js';
import { releaseExpandedChatScrollLock } from './ExpandedChatOverlay.js';

type BadgeBookOverlayProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  handoffFromLift?: boolean;
  handoffTarget?: BadgeBookLiftTarget | null;
};

export function BadgeBookOverlay(props: BadgeBookOverlayProps): ReactElement | null {
  const close = useCallback((): void => {
    releaseExpandedChatScrollLock();
    props.onClose();
  }, [props.onClose]);

  useEffect(() => {
    if (!props.open) {
      releaseExpandedChatScrollLock();
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        close();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      releaseExpandedChatScrollLock();
    };
  }, [close, props.open]);

  if (!props.open) {
    return null;
  }

  const useHandoffLayout = props.handoffFromLift === true && props.handoffTarget != null;

  const panelSlotStyle: CSSProperties | undefined = useHandoffLayout
    ? {
        position: 'fixed',
        left: props.handoffTarget!.left,
        top: props.handoffTarget!.top,
        width: props.handoffTarget!.width,
        ...badgeBookSpreadCssVars(props.handoffTarget!),
      }
    : undefined;

  const overlay = (
    <div
      aria-label={props.label}
      aria-modal={true}
      className={
        'badge-book-expand-host is-badge-book-expanded' +
        (useHandoffLayout ? ' is-lift-handoff' : '')
      }
      role="dialog"
    >
      <button
        aria-label="Close badge book"
        className="badge-book-expand-backdrop"
        onClick={close}
        type="button"
      />

      <div className="badge-book-expand-surface">
        <button
          aria-label="Close badge book"
          className="nami-surface-button badge-book-expand-dismiss"
          onClick={close}
          type="button"
        >
          Close
        </button>
        <div className="badge-book-expand-panel-slot" style={panelSlotStyle}>
          {props.children}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
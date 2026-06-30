import { createPortal } from 'react-dom';
import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';

const POPOVER_WIDTH_PX = 360;
const VIEWPORT_GUTTER_PX = 8;

export function useChatComposerPopoverPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean
): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    function updatePosition(): void {
      const anchor = anchorRef.current;

      if (!anchor) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const maxLeft = window.innerWidth - POPOVER_WIDTH_PX - VIEWPORT_GUTTER_PX;

      setStyle({
        position: 'fixed',
        left: Math.max(VIEWPORT_GUTTER_PX, Math.min(rect.left, maxLeft)),
        bottom: window.innerHeight - rect.top + VIEWPORT_GUTTER_PX,
        width: 'min(' + String(POPOVER_WIDTH_PX) + 'px, calc(100vw - ' + String(VIEWPORT_GUTTER_PX * 2) + 'px))',
        maxHeight: 'min(72vh, 520px)',
        zIndex: 1400,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, open]);

  return style;
}

export function ChatComposerAnchorPopover(props: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  className: string;
  ariaLabel: string;
  children: ReactNode;
}): ReactElement | null {
  const style = useChatComposerPopoverPosition(props.anchorRef, props.open);

  if (!props.open || !style) {
    return null;
  }

  return createPortal(
    <div className={props.className} role="dialog" aria-label={props.ariaLabel} style={style}>
      {props.children}
    </div>,
    document.body
  );
}
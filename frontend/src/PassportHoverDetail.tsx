import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type TooltipAlign = 'center' | 'end';

type TooltipPosition = {
  top: number;
  left: number;
  align: TooltipAlign;
};

function readTooltipPosition(anchor: HTMLElement, align: TooltipAlign): TooltipPosition {
  const rect = anchor.getBoundingClientRect();
  const gap = 10;

  return {
    top: rect.bottom + gap,
    left: align === 'end' ? rect.right : rect.left + rect.width / 2,
    align,
  };
}

export function PassportHoverDetail(props: {
  label: string;
  detail?: string;
  children: ReactNode;
  className?: string;
  block?: boolean;
  align?: TooltipAlign;
}): ReactElement {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, align: 'center' });
  const align = props.align ?? 'center';

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;

    if (!anchor) {
      return;
    }

    setPosition(readTooltipPosition(anchor, align));
  }, [align]);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }

    updatePosition();

    function handleReposition(): void {
      updatePosition();
    }

    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [updatePosition, visible]);

  function showTooltip(): void {
    updatePosition();
    setVisible(true);
  }

  function hideTooltip(): void {
    setVisible(false);
  }

  const tooltipStyle: CSSProperties = {
    top: position.top,
    left: position.left,
    transform: position.align === 'end' ? 'translateX(-100%)' : 'translateX(-50%)',
  };

  const tooltip =
    visible && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={
              'passport-hover-detail-tooltip is-portaled' +
              (position.align === 'end' ? ' is-align-end' : ' is-align-center')
            }
            role="tooltip"
            style={tooltipStyle}
          >
            <strong>{props.label}</strong>
            {props.detail ? <span>{props.detail}</span> : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        className={
          'passport-hover-detail' +
          (props.block ? ' is-block-hover-detail' : '') +
          (props.className ? ' ' + props.className : '')
        }
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            hideTooltip();
          }
        }}
        onFocus={showTooltip}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        ref={anchorRef}
      >
        {props.children}
      </span>
      {tooltip}
    </>
  );
}
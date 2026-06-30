import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';

import {
  computeGiftOverlayMotionFrame,
  formatGiftOverlayHitCount,
} from './gift-overlay-motion.js';
import {
  advanceGiftOverlayFloats,
  useGiftOverlayFloats,
  type GiftOverlayFloat,
} from './gift-store.js';
import { GiftIcon } from './GiftIcon.js';

type GiftOverlayProps = {
  streamKey?: string;
  targetMemberId?: string;
};

function overlayFloatStyle(float: GiftOverlayFloat, nowMs: number): CSSProperties {
  const motion = computeGiftOverlayMotionFrame({
    spawnBottomPercent: float.spawnBottomPercent,
    phaseStartedAtMs: float.phaseStartedAtMs,
    nowMs,
  });

  return {
    left: float.spawnXPercent + '%',
    bottom: motion.bottomPercent + '%',
    opacity: motion.opacity,
    transform: 'translateX(-50%)',
  };
}

export function GiftOverlay(props: GiftOverlayProps): ReactElement | null {
  const floats = useGiftOverlayFloats(props.streamKey).filter((row) => {
    if (!props.targetMemberId) {
      return true;
    }

    return row.targetMemberId === props.targetMemberId;
  });
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (floats.length === 0) {
      return;
    }

    let frameId = 0;
    let running = true;

    const tick = (): void => {
      if (!running) {
        return;
      }

      const nextNow = Date.now();
      advanceGiftOverlayFloats(nextNow);
      setNowMs(nextNow);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      running = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [floats.length, props.streamKey, props.targetMemberId]);

  if (floats.length === 0) {
    return null;
  }

  return (
    <div aria-live="polite" className="gift-overlay-layer">
      {floats.map((float) => {
        const hitLabel = formatGiftOverlayHitCount(float.hitCount);

        return (
          <div
            className={'gift-overlay-float gift-overlay-float-' + float.giftTier}
            key={float.id}
            style={overlayFloatStyle(float, nowMs)}
          >
            <div className="gift-overlay-bubble">
              <GiftIcon
                className="gift-overlay-emoji"
                emoji={float.giftEmoji}
                iconUrl={float.giftIconUrl}
                imageClassName="gift-overlay-icon"
              />
              <div className="gift-overlay-meta">
                {hitLabel ? <p className="gift-overlay-count">{hitLabel}</p> : null}
                <p className="gift-overlay-sender">{float.senderMemberName}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
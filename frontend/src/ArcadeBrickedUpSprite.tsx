import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { readArcadeBrickedUpSpriteSlot, type ArcadeBrickedUpSpriteSlotId } from './arcade-bricked-up-sprites.js';
import { OwnerEditableImage } from './OwnerEditableImage.js';

export function ArcadeBrickedUpSprite(props: {
  slot: ArcadeBrickedUpSpriteSlotId;
  className?: string;
  style?: CSSProperties;
  fallback: ReactNode;
}): ReactElement {
  const slot = readArcadeBrickedUpSpriteSlot(props.slot);

  return (
    <span
      aria-hidden="true"
      className={
        'arcade-bricked-up-sprite-shell' + (props.className ? ' ' + props.className : '')
      }
      style={props.style}
    >
      <OwnerEditableImage
        className="arcade-bricked-up-sprite"
        fallback={<span className="arcade-bricked-up-sprite-fallback">{props.fallback}</span>}
        imageClassName="arcade-bricked-up-sprite-asset"
        label={slot.label}
        nested
        slotId={slot.id}
      />
    </span>
  );
}
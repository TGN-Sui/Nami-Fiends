import type { CSSProperties, ReactElement, ReactNode } from 'react';

import type { ChatBorderPresentation, ChatBorderTileId } from './chat-border-rendering.js';

const TILE_ORDER: ChatBorderTileId[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

const TILE_GRID_AREA: Record<ChatBorderTileId, string> = {
  nw: '1 / 1',
  n: '1 / 2',
  ne: '1 / 3',
  w: '2 / 1',
  e: '2 / 3',
  sw: '3 / 1',
  s: '3 / 2',
  se: '3 / 3',
};

export function ChatBorderArtFrame(props: {
  presentation: ChatBorderPresentation;
  className: string;
  children: ReactNode;
}): ReactElement {
  const frameStyle: CSSProperties = {
    ...props.presentation.style,
    display: 'grid',
  };

  return (
    <div className={props.className} style={frameStyle}>
      {TILE_ORDER.map((tileId) => {
        const tileStyle = props.presentation.tileStyles[tileId];

        if (!tileStyle) {
          return null;
        }

        return (
          <span
            aria-hidden
            className={'chat-border-art-tile is-' + tileId}
            key={tileId}
            style={{ ...tileStyle, gridArea: TILE_GRID_AREA[tileId] }}
          />
        );
      })}
      <div className="chat-border-art-center">{props.children}</div>
    </div>
  );
}
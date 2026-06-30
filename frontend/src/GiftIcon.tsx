import type { ReactElement } from 'react';

export function GiftIcon(props: {
  emoji: string;
  iconUrl?: string | null | undefined;
  className?: string;
  imageClassName?: string;
}): ReactElement {
  if (props.iconUrl) {
    return (
      <img
        alt=""
        className={props.imageClassName ?? props.className ?? 'gift-icon-image'}
        src={props.iconUrl}
      />
    );
  }

  return (
    <span aria-hidden="true" className={props.className ?? 'gift-icon-emoji'}>
      {props.emoji}
    </span>
  );
}
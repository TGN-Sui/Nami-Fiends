import type { ReactElement, ReactNode } from 'react';

import { messageBubbleClass } from './member-access.js';
import { resolveChatOverlayForMember } from './chat-overlay-rewards.js';
import type { NamiMember } from './uiMockData.js';

export function ChatMessageBubble(props: {
  member: NamiMember | undefined;
  authorName: string;
  children: ReactNode;
}): ReactElement {
  const overlay = resolveChatOverlayForMember(props.member);

  return (
    <div className={'message-bubble-shell' + (overlay ? ' has-chat-message-overlay' : '')}>
      {overlay ? (
        <span
          aria-hidden="true"
          className={overlay.className}
          title={overlay.name + ' chat overlay'}
        />
      ) : null}
      <div className={'message-bubble' + messageBubbleClass(props.member, props.authorName)}>
        {props.children}
      </div>
    </div>
  );
}
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
    <div className="message-bubble-shell">
      <div
        className={
          'message-bubble' +
          messageBubbleClass(props.member, props.authorName) +
          (overlay ? ' ' + overlay.className : '')
        }
      >
        {props.children}
      </div>
    </div>
  );
}
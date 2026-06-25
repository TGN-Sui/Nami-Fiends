import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { buildChatBorderPresentation } from './chat-border-rendering.js';
import {
  resolveChatOverlayForMember,
  resolveEquippedChatOverlayReward,
} from './chat-overlay-rewards.js';
import { messageBubbleClass } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

export function ChatMessageBubble(props: {
  member: NamiMember | undefined;
  authorName: string;
  children: ReactNode;
}): ReactElement {
  const fallbackClass = messageBubbleClass(props.member, props.authorName);
  const overlay = resolveChatOverlayForMember(props.member);
  const equippedReward = resolveEquippedChatOverlayReward(props.member);
  const presentation = equippedReward
    ? buildChatBorderPresentation(equippedReward, fallbackClass)
    : null;

  const className =
    'message-bubble' +
    fallbackClass +
    (presentation?.hasCustomArt
      ? ' ' + presentation.className
      : overlay
        ? ' ' + overlay.className
        : '');

  const style: CSSProperties | undefined = presentation?.hasCustomArt
    ? presentation.style
    : undefined;

  return (
    <div className="message-bubble-shell">
      <div className={className} style={style}>
        {props.children}
      </div>
    </div>
  );
}
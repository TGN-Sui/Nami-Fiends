import type { ReactElement } from 'react';

import { mergeQualifiedChatEmojis } from './chat-composer-emojis.js';
import {
  parseCustomEmojiSegments,
  useNamiCustomEmojis,
  type NamiCustomEmoji,
} from './nami-custom-emojis-store.js';
import { parseTaggedMessage } from './nami-tag-registry.js';

export type TagNavigationHandlers = {
  onOpenMember?: (memberId: string) => void;
  onOpenChannel?: (channelId: string) => void;
  onOpenStudio?: (studioId: string) => void;
  onOpenGuilds?: () => void;
};

type TaggedMessageBodyProps = {
  body: string;
  customEmojis?: NamiCustomEmoji[];
  transformText?: (text: string) => string;
  handlers?: TagNavigationHandlers;
};

function tagClassName(kind: string): string {
  return 'nami-message-tag nami-message-tag-' + kind;
}

function renderTextWithEmojis(
  text: string,
  keyPrefix: string,
  customEmojis?: NamiCustomEmoji[],
): ReactElement {
  const segments = parseCustomEmojiSegments(text, customEmojis);

  return (
    <span className="nami-emoji-rich-text">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={keyPrefix + '-text-' + index}>{segment.value}</span>;
        }

        return (
          <img
            alt={segment.emoji.label}
            className="nami-custom-emoji-inline"
            key={keyPrefix + '-emoji-' + index}
            src={segment.emoji.imageUrl}
            title={segment.emoji.label}
          />
        );
      })}
    </span>
  );
}

export function TaggedMessageBody(props: TaggedMessageBodyProps): ReactElement {
  useNamiCustomEmojis();
  const segments = parseTaggedMessage(props.body);
  const handlers = props.handlers ?? {};
  const chatEmojis = mergeQualifiedChatEmojis(props.customEmojis ?? []);

  return (
    <span className="nami-tagged-message-body">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          const value = props.transformText ? props.transformText(segment.value) : segment.value;

          return (
            <span key={'text-' + index}>
              {renderTextWithEmojis(value, 'tag-text-' + index, chatEmojis)}
            </span>
          );
        }

        const tagSegment = segment;

        function handleTagClick(): void {
          if (tagSegment.target.kind === 'member') {
            handlers.onOpenMember?.(tagSegment.target.id);
            return;
          }

          if (tagSegment.target.kind === 'channel') {
            handlers.onOpenChannel?.(tagSegment.target.id);
            return;
          }

          if (tagSegment.target.kind === 'studio' || tagSegment.target.kind === 'dev') {
            handlers.onOpenStudio?.(tagSegment.target.id);
            return;
          }

          if (tagSegment.target.kind === 'guild' || tagSegment.target.kind === 'squad') {
            handlers.onOpenGuilds?.();
          }
        }

        const hasHandler =
          (tagSegment.target.kind === 'member' && handlers.onOpenMember) ||
          (tagSegment.target.kind === 'channel' && handlers.onOpenChannel) ||
          ((tagSegment.target.kind === 'studio' || tagSegment.target.kind === 'dev') &&
            handlers.onOpenStudio) ||
          ((tagSegment.target.kind === 'guild' || tagSegment.target.kind === 'squad') &&
            handlers.onOpenGuilds);

        if (!hasHandler) {
          return (
            <span className={tagClassName(tagSegment.target.kind)} key={'tag-' + index}>
              {tagSegment.raw}
            </span>
          );
        }

        return (
          <button
            className={tagClassName(tagSegment.target.kind) + ' nami-message-tag-button'}
            key={'tag-' + index}
            onClick={handleTagClick}
            type="button"
          >
            {tagSegment.raw}
          </button>
        );
      })}
    </span>
  );
}
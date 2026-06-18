import { useEffect, type ReactElement } from 'react';

import {
  castGenreBroadcastVote,
  formatBroadcastCountdown,
  setGenreBroadcastExpanded,
  useGenreBroadcastVote,
} from './genre-chat-broadcast-vote-store.js';
import type { GlobalChatRoom } from './global-chats.js';
import { useSelfMember } from './member-avatar-store.js';
import { SocialEmbedPlayer } from './SocialEmbedPlayer.js';

export function GenreChatBroadcastAside(props: {
  chat: GlobalChatRoom;
  isExpanded: boolean;
}): ReactElement {
  const selfMember = useSelfMember();
  const voteState = useGenreBroadcastVote(props.chat, selfMember.id);

  useEffect(() => {
    setGenreBroadcastExpanded(props.chat, props.isExpanded);

    return () => {
      setGenreBroadcastExpanded(props.chat, false);
    };
  }, [props.chat.id, props.chat.activeMembers, props.isExpanded]);

  const activeBroadcast = voteState.activeBroadcast;

  if (!activeBroadcast) {
    return (
      <div className="genre-chat-expanded-broadcast is-empty">
        <p>No tagged live broadcasts in {props.chat.title} right now.</p>
      </div>
    );
  }

  const streamPosition = voteState.streamIndex + 1;
  const streamTotal = voteState.broadcasts.length;

  return (
    <div className="genre-chat-expanded-broadcast">
      <header className="genre-chat-expanded-broadcast-head">
        <div>
          <span className="mini-badge">Live in {props.chat.title}</span>
          <strong>{activeBroadcast.memberName}</strong>
          <small>
            Tag: {activeBroadcast.streamTag} · Stream {streamPosition} of {streamTotal}
          </small>
        </div>
        <span className="genre-chat-broadcast-timer" aria-live="polite">
          {formatBroadcastCountdown(voteState.slotRemainingMs)}
        </span>
      </header>

      <div className="genre-chat-expanded-broadcast-player-shell">
        <SocialEmbedPlayer embed={activeBroadcast.embed} featured surface="member" />
      </div>

      <div className="genre-chat-broadcast-vote-panel" aria-label="Anonymous broadcast vote">
        <div className="genre-chat-broadcast-vote-copy">
          <p>
            {voteState.audienceSize.toLocaleString()} members in expanded chat. Majority skip needs{' '}
            {voteState.majorityNeeded.toLocaleString()} votes.
          </p>
          <div className="genre-chat-broadcast-vote-tally" aria-hidden="true">
            <span>Skip {voteState.skipVotes.toLocaleString()}</span>
            <span>Watch {voteState.watchVotes.toLocaleString()}</span>
          </div>
        </div>

        <div className="genre-chat-broadcast-vote-actions">
          <button
            className={
              'nami-surface-button genre-chat-broadcast-vote-button is-skip-vote' +
              (voteState.selfVote === 'skip' ? ' is-active-vote' : '')
            }
            onClick={() => castGenreBroadcastVote(props.chat, selfMember.id, 'skip')}
            type="button"
          >
            Skip
          </button>
          <button
            className={
              'nami-surface-button genre-chat-broadcast-vote-button is-watch-vote' +
              (voteState.selfVote === 'watch' ? ' is-active-vote' : '')
            }
            onClick={() => castGenreBroadcastVote(props.chat, selfMember.id, 'watch')}
            type="button"
          >
            Watch
          </button>
        </div>

        <p className="genre-chat-broadcast-vote-note">
          Votes are anonymous. Majority skip switches immediately. If Watch leads when the timer ends,
          this stream gets another 10 minutes.
        </p>
      </div>
    </div>
  );
}
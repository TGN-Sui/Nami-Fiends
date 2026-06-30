import { useMemo, useState, type ReactElement } from 'react';

import { ChatComposerWithEmojis } from './ChatComposerWithEmojis.js';
import { memberChatGiftTarget } from './chat-composer-gift-target.js';
import { UniformMemberAvatar } from './member-avatar.js';
import { canSendPrivateMessages } from './member-access.js';
import { messageComposeCandidates } from './message-compose.js';
import { ensurePrivateThread, sendPrivateMessage } from './messages-store.js';
import { searchMemberPredictions } from './member-search.js';
import { tagSuggestionHint } from './nami-tag-registry.js';
import type { NamiMember } from './uiMockData.js';

type MessageComposeOverlayProps = {
  onClose: () => void;
  onOpenThread: (memberId: string) => void;
};

export function MessageComposeOverlay(props: MessageComposeOverlayProps): ReactElement {
  const candidates = useMemo(() => messageComposeCandidates(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const canSend = canSendPrivateMessages();

  const predictions = useMemo(
    () => searchMemberPredictions(searchQuery, candidates, 8),
    [candidates, searchQuery]
  );

  const selectedMember =
    predictions.find((member) => member.id === selectedMemberId) ??
    candidates.find((member) => member.id === selectedMemberId) ??
    null;

  function startConversation(): void {
    if (!selectedMember) {
      return;
    }

    const trimmedDraft = draft.trim();

    if (trimmedDraft && canSend) {
      sendPrivateMessage(selectedMember.id, selectedMember.name, trimmedDraft);
    } else {
      ensurePrivateThread(selectedMember.id, selectedMember.name);
    }

    props.onOpenThread(selectedMember.id);
    props.onClose();
  }

  function selectMember(member: NamiMember): void {
    setSelectedMemberId(member.id);
  }

  return (
    <div
      aria-label="Compose private message"
      aria-modal="true"
      className="message-compose-overlay"
      role="dialog"
    >
      <article className="message-compose-modal panel">
        <header className="message-compose-header">
          <div>
            <p>New message</p>
            <h2>Choose a member</h2>
          </div>
          <button className="nami-surface-button" onClick={props.onClose} type="button">
            Cancel
          </button>
        </header>

        <label className="message-compose-search-field">
          <span>Search members</span>
          <input
            autoFocus
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, badge, or tier"
            type="search"
            value={searchQuery}
          />
        </label>

        <div className="message-compose-member-results" role="listbox">
          {predictions.length === 0 ? (
            <p className="message-compose-empty">No members match that search.</p>
          ) : (
            predictions.map((member) => {
              const selected = member.id === selectedMemberId;

              return (
                <button
                  aria-selected={selected}
                  className={'message-compose-member-row' + (selected ? ' is-selected' : '')}
                  key={member.id}
                  onClick={() => selectMember(member)}
                  role="option"
                  type="button"
                >
                  <UniformMemberAvatar member={member} />
                  <div>
                    <strong>{member.name}</strong>
                    <span>
                      {member.tier} · {member.badge}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedMember ? (
          <div className="message-compose-draft-shell">
            <p className="message-compose-draft-label">
              Optional first message to <strong>{selectedMember.name}</strong>
            </p>
            <ChatComposerWithEmojis
              ariaLabel={'First private message to ' + selectedMember.name}
              canSend={canSend}
              className="chat-composer-row message-log-composer message-compose-composer"
              giftTarget={memberChatGiftTarget(selectedMember)}
              onChange={setDraft}
              onSend={startConversation}
              placeholder={
                canSend
                  ? 'Write your first message · ' + tagSuggestionHint()
                  : 'Sign in and verify to send private messages'
              }
              value={draft}
            />
          </div>
        ) : null}

        <div className="message-compose-actions">
          <button
            className="nami-surface-button is-primary-surface-button"
            disabled={!selectedMember}
            onClick={startConversation}
            type="button"
          >
            {draft.trim() && canSend ? 'Send and open thread' : 'Open conversation'}
          </button>
        </div>
      </article>
    </div>
  );
}
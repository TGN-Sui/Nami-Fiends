import { useMemo, useState, type ReactElement } from 'react';

import { PROMOTION_DURATION_LABELS } from './channel-owner-promotions-store.js';
import { GameSubmissionTicketsPanel } from './GameSubmissionTicketsPanel.js';
import { countPendingUserSuggestions, updateUserSuggestionStatus, useUserSuggestions } from './nami-user-suggestions-store.js';
import {
  countPendingPartnerBannerSubmissions,
  listPartnerBannerSubmissionsSorted,
  updatePartnerBannerSubmissionStatus,
  usePartnerBannerSubmissions,
} from './partner-banner-submission-store.js';
import { countPendingGameSubmissionTickets } from './nami-officials-submission-counts.js';

type OfficialsSubmissionTab = 'suggestions' | 'games' | 'partner-banners';

const TAB_LABELS: Record<OfficialsSubmissionTab, string> = {
  suggestions: 'Suggestions',
  games: 'Game tickets',
  'partner-banners': 'Partner banners',
};

function formatSubmittedAt(submittedAtMs: number): string {
  return new Date(submittedAtMs).toLocaleString();
}

function UserSuggestionsOfficialsPanel(): ReactElement {
  const suggestions = useUserSuggestions();
  const [notice, setNotice] = useState<string | null>(null);

  const sortedSuggestions = useMemo(
    () => [...suggestions].sort((left, right) => right.submittedAtMs - left.submittedAtMs),
    [suggestions],
  );

  function handleStatusChange(
    suggestionId: string,
    status: 'reviewed' | 'archived',
  ): void {
    const updated = updateUserSuggestionStatus(suggestionId, status, 'nami-official');

    if (!updated) {
      setNotice('Could not update suggestion.');
      return;
    }

    setNotice('Suggestion marked ' + status + '.');
  }

  return (
    <div className="nami-officials-submission-tab-panel">
      {notice ? <p className="protocol-hint">{notice}</p> : null}

      {sortedSuggestions.length === 0 ? (
        <p className="protocol-hint">No user suggestions submitted yet.</p>
      ) : (
        <ol className="game-submission-ticket-list user-suggestions-officials-list">
          {sortedSuggestions.map((entry) => (
            <li className="game-submission-ticket-card user-suggestions-officials-card" key={entry.id}>
              <div className="game-submission-ticket-copy">
                <strong>{entry.submitterName}</strong>
                <span>{entry.submitterEmail || 'no email on file'}</span>
                <span>{entry.surfaceRole} · {formatSubmittedAt(entry.submittedAtMs)}</span>
                <p className="user-suggestions-officials-body">{entry.body}</p>
              </div>
              <div className="game-submission-ticket-score">
                <span className={'game-submission-ticket-status is-' + entry.status}>{entry.status}</span>
              </div>
              <div className="game-submission-ticket-actions">
                {entry.status === 'submitted' ? (
                  <button
                    className="primary-action"
                    onClick={() => handleStatusChange(entry.id, 'reviewed')}
                    type="button"
                  >
                    Mark reviewed
                  </button>
                ) : null}
                {entry.status !== 'archived' ? (
                  <button
                    className="secondary-action"
                    onClick={() => handleStatusChange(entry.id, 'archived')}
                    type="button"
                  >
                    Archive
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function PartnerBannerSubmissionsPanel(): ReactElement {
  const submissions = usePartnerBannerSubmissions();
  const [notice, setNotice] = useState<string | null>(null);

  const sortedSubmissions = useMemo(() => listPartnerBannerSubmissionsSorted(), [submissions]);

  function handleStatusChange(
    submissionId: string,
    status: 'approved' | 'rejected',
  ): void {
    const updated = updatePartnerBannerSubmissionStatus(submissionId, status, 'nami-official');

    if (!updated) {
      setNotice('Could not update partner banner submission.');
      return;
    }

    setNotice(
      updated.channelTitle + ' partner banner marked ' + status + '.',
    );
  }

  return (
    <div className="nami-officials-submission-tab-panel">
      {notice ? <p className="protocol-hint">{notice}</p> : null}

      {sortedSubmissions.length === 0 ? (
        <p className="protocol-hint">No partner banner submissions yet.</p>
      ) : (
        <ol className="game-submission-ticket-list partner-banner-submissions-list">
          {sortedSubmissions.map((entry) => (
            <li className="game-submission-ticket-card partner-banner-submission-card" key={entry.id}>
              <div className="game-submission-ticket-copy">
                <strong>{entry.title || entry.channelTitle}</strong>
                <span>{entry.channelTitle}</span>
                <span>{PROMOTION_DURATION_LABELS[entry.duration]}</span>
                <p>{entry.description || 'No description provided.'}</p>
                {entry.coverUrl ? (
                  <div
                    className="partner-banner-submission-cover-preview"
                    style={{ backgroundImage: 'url(' + JSON.stringify(entry.coverUrl) + ')' }}
                  />
                ) : (
                  <p className="protocol-hint">No cover uploaded.</p>
                )}
              </div>
              <div className="game-submission-ticket-score">
                <span className={'game-submission-ticket-status is-' + entry.status}>{entry.status}</span>
                <span>{formatSubmittedAt(entry.submittedAtMs)}</span>
              </div>
              <div className="game-submission-ticket-actions">
                {entry.status !== 'approved' ? (
                  <button
                    className="primary-action"
                    onClick={() => handleStatusChange(entry.id, 'approved')}
                    type="button"
                  >
                    Approve
                  </button>
                ) : null}
                {entry.status !== 'rejected' ? (
                  <button
                    className="secondary-action"
                    onClick={() => handleStatusChange(entry.id, 'rejected')}
                    type="button"
                  >
                    Reject
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function NamiOfficialsSubmissionsPanel(props: { embedded?: boolean } = {}): ReactElement {
  const [activeTab, setActiveTab] = useState<OfficialsSubmissionTab>('suggestions');

  const pendingSuggestions = countPendingUserSuggestions();
  const pendingGames = countPendingGameSubmissionTickets();
  const pendingPartnerBanners = countPendingPartnerBannerSubmissions();
  const pendingTotal = pendingSuggestions + pendingGames + pendingPartnerBanners;

  const tabs: OfficialsSubmissionTab[] = ['suggestions', 'games', 'partner-banners'];

  function pendingCountForTab(tab: OfficialsSubmissionTab): number {
    if (tab === 'suggestions') {
      return pendingSuggestions;
    }

    if (tab === 'games') {
      return pendingGames;
    }

    return pendingPartnerBanners;
  }

  return (
    <article
      className={
        'panel settings-card nami-officials-submissions-panel' +
        (props.embedded ? ' is-embedded-officials-submissions' : '')
      }
    >
      <div className="profile-panel-heading">
        <h2>Nami Officials submissions</h2>
        <p>
          Review user suggestions, new game tickets, and partner banner requests from one queue.
          {pendingTotal > 0 ? ' ' + pendingTotal + ' item(s) awaiting review.' : ''}
        </p>
      </div>

      <div
        aria-label="Official submission queues"
        className="nami-officials-submissions-tab-row tab-row"
        role="tablist"
      >
        {tabs.map((tab) => {
          const pending = pendingCountForTab(tab);

          return (
            <button
              aria-selected={activeTab === tab}
              className={activeTab === tab ? 'is-active-tab' : ''}
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {TAB_LABELS[tab]}
              {pending > 0 ? ' (' + pending + ')' : ''}
            </button>
          );
        })}
      </div>

      {activeTab === 'suggestions' ? <UserSuggestionsOfficialsPanel /> : null}
      {activeTab === 'games' ? <GameSubmissionTicketsPanel embedded /> : null}
      {activeTab === 'partner-banners' ? <PartnerBannerSubmissionsPanel /> : null}
    </article>
  );
}
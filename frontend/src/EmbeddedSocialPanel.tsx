import { useEffect, useState, type ReactElement } from 'react';

import {
  embedCardKey,
  isEmbedCollapsed,
  readEmbeddedFeedLinks,
  saveEmbedCollapsed,
  subscribeEmbedCollapsed,
  subscribeEmbeddedFeedLinks,
} from './embedded-feed-preferences.js';
import { type SocialEmbed } from './global-chats.js';
import {
  canPublishMemberFeed,
  canReportMemberFeedAbuse,
  canViewMemberFeeds,
} from './member-feed-access.js';
import {
  isMemberFeedSuspended,
  MEMBER_FEED_ABUSE_REPORT_TYPES,
  submitMemberFeedAbuseReport,
  useMemberFeedAbuseReports,
  type MemberFeedAbuseReportType,
} from './member-feed-abuse-store.js';
import { getSelfMember } from './member-access.js';
import { members } from './uiMockData.js';
import { SocialEmbedPlayer } from './SocialEmbedPlayer.js';
import { resolveSocialEmbed } from './social-embed.js';
import {
  canConfigureEmbeddedFeedSurface,
  canShowEmbeddedFeedSurface,
  isSelfMember,
  readEmbeddedFeedEnabled,
  readUserSurfaceRole,
  saveEmbeddedFeedEnabled,
  subscribeEmbeddedFeedEnabled,
  type EmbeddedFeedSurface,
} from './surface-preferences.js';

function platformLabel(platform: SocialEmbed['platform']): string {
  if (platform === 'x') {
    return 'X Post';
  }

  if (platform === 'twitch') {
    return 'Live on Twitch';
  }

  return 'YouTube';
}

function memberById(memberId: string | undefined) {
  if (!memberId) {
    return undefined;
  }

  return members.find((member) => member.id === memberId);
}

function MemberFeedReportAbuseDialog(props: {
  feedOwnerMemberId: string;
  feedOwnerName: string;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}): ReactElement {
  const selfMember = getSelfMember();
  const [selectedType, setSelectedType] = useState<MemberFeedAbuseReportType | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  function submitReport(): void {
    if (!selectedType) {
      setErrorMessage('Choose a report type to continue.');
      return;
    }

    const result = submitMemberFeedAbuseReport({
      feedOwnerMemberId: props.feedOwnerMemberId,
      feedOwnerName: props.feedOwnerName,
      reporter: selfMember,
      reportType: selectedType,
    });

    if (!result.ok) {
      setErrorMessage(result.reason);
      return;
    }

    const notice =
      result.suspended
        ? 'Report submitted. Member feeds are suspended pending Nami review.'
        : result.officialNotified
          ? 'Report submitted. Nami officials have been notified.'
          : 'Report submitted. Thank you for helping keep member feeds safe.';

    props.onSubmitted(notice);
    props.onClose();
  }

  return (
    <div className="member-feed-abuse-dialog-backdrop" role="presentation">
      <div
        aria-labelledby="member-feed-abuse-dialog-title"
        aria-modal="true"
        className="member-feed-abuse-dialog"
        role="dialog"
      >
        <div className="profile-panel-heading">
          <div>
            <h2 id="member-feed-abuse-dialog-title">Report abuse</h2>
            <p>
              Report misconduct, adult material, or misuse of {props.feedOwnerName}&apos;s embedded
              member feeds.
            </p>
          </div>
          <button className="profile-secondary-link" onClick={props.onClose} type="button">
            Close
          </button>
        </div>

        <div className="member-feed-abuse-type-grid">
          {MEMBER_FEED_ABUSE_REPORT_TYPES.map((entry) => (
            <button
              aria-pressed={selectedType === entry.id}
              className={
                'member-feed-abuse-type-button' +
                (selectedType === entry.id ? ' is-selected-abuse-type' : '')
              }
              key={entry.id}
              onClick={() => {
                setSelectedType(entry.id);
                setErrorMessage('');
              }}
              type="button"
            >
              {entry.label}
            </button>
          ))}
        </div>

        {errorMessage ? <p className="member-feed-abuse-error">{errorMessage}</p> : null}

        <div className="member-feed-abuse-dialog-actions">
          <button className="profile-secondary-link" onClick={props.onClose} type="button">
            Cancel
          </button>
          <button
            className="nami-surface-button is-primary-surface-button"
            onClick={submitReport}
            type="button"
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmbeddedSocialPanel(props: {
  title?: string;
  embeds?: SocialEmbed[];
  surface: EmbeddedFeedSurface;
  showFeedToggle?: boolean;
  showFeedSettings?: boolean;
  onOpenFeedSettings?: () => void;
  feedOwnerMemberId?: string;
  viewerAccess?: 'guest';
}): ReactElement {
  const selfMember = getSelfMember();
  const role = readUserSurfaceRole();
  const canConfigure = canConfigureEmbeddedFeedSurface(props.surface, role, selfMember);
  const canShowPanel = canShowEmbeddedFeedSurface(props.surface, role, selfMember);
  const isMemberSurface = props.surface === 'member';
  const feedOwner = memberById(props.feedOwnerMemberId);
  const viewer =
    props.viewerAccess === 'guest'
      ? { ...selfMember, signal: 'Orange' as const, tier: 'Adventurer' as const }
      : selfMember;

  useMemberFeedAbuseReports();

  const [feedEnabled, setFeedEnabled] = useState(() => readEmbeddedFeedEnabled(props.surface));
  const [embeds, setEmbeds] = useState<SocialEmbed[]>(() => {
    return props.embeds ?? readEmbeddedFeedLinks(props.surface);
  });
  const [collapseRevision, setCollapseRevision] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportNotice, setReportNotice] = useState('');

  useEffect(() => {
    return subscribeEmbeddedFeedEnabled(() => {
      setFeedEnabled(readEmbeddedFeedEnabled(props.surface));
    });
  }, [props.surface]);

  useEffect(() => {
    if (props.embeds) {
      return;
    }

    function refreshEmbeds(): void {
      setEmbeds(readEmbeddedFeedLinks(props.surface));
    }

    refreshEmbeds();

    return subscribeEmbeddedFeedLinks(refreshEmbeds);
  }, [props.embeds, props.surface]);

  useEffect(() => subscribeEmbedCollapsed(() => setCollapseRevision((value) => value + 1)), []);

  if (!canShowPanel && !isMemberSurface) {
    return <></>;
  }

  if (isMemberSurface) {
    if (!feedOwner || !canPublishMemberFeed(feedOwner)) {
      return <></>;
    }

    if (!canViewMemberFeeds(viewer)) {
      return (
        <article className="panel embedded-social-panel is-member-feed-locked" data-embedded-surface="member">
          <div className="profile-panel-heading embedded-social-panel-heading">
            <div>
              <h2>{props.title ?? 'Member Feed'}</h2>
              <p>Member feeds are available to verified members only. NPCs and unverified members cannot use this feature.</p>
            </div>
          </div>
        </article>
      );
    }

    if (isMemberFeedSuspended(feedOwner.id)) {
      return (
        <article
          className="panel embedded-social-panel is-member-feed-suspended"
          data-embedded-surface="member"
        >
          <div className="profile-panel-heading embedded-social-panel-heading">
            <div>
              <h2>{props.title ?? 'Member Feed'}</h2>
              <p>
                Member feeds for {feedOwner.name} are suspended pending Nami review of abuse
                reports.
              </p>
            </div>
          </div>
          <div className="embedded-social-disabled-state member-feed-suspension-notice">
            <p>Feeds stay hidden until Nami officials view and resolve the open reports.</p>
          </div>
        </article>
      );
    }
  } else if (!canShowPanel) {
    return <></>;
  }

  function toggleFeed(): void {
    saveEmbeddedFeedEnabled(props.surface, !feedEnabled);
    setFeedEnabled(!feedEnabled);
  }

  const parentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const orderedEmbeds = [...embeds.filter((embed) => embed.live), ...embeds.filter((embed) => !embed.live)];
  const expandedCount = orderedEmbeds.filter((embed, index) => {
    const key = embedCardKey(embed, index);
    return !isEmbedCollapsed(props.surface, key, embed.live === true);
  }).length;

  const canReportAbuse =
    isMemberSurface &&
    feedOwner !== undefined &&
    !isSelfMember(feedOwner.id) &&
    canReportMemberFeedAbuse(selfMember);

  function toggleEmbed(cardKey: string, featured: boolean): void {
    const collapsed = isEmbedCollapsed(props.surface, cardKey, featured);
    saveEmbedCollapsed(props.surface, cardKey, !collapsed);
    setCollapseRevision((value) => value + 1);
  }

  function expandAllEmbeds(): void {
    orderedEmbeds.forEach((embed, index) => {
      saveEmbedCollapsed(props.surface, embedCardKey(embed, index), false);
    });
    setCollapseRevision((value) => value + 1);
  }

  function collapseAllEmbeds(): void {
    orderedEmbeds.forEach((embed, index) => {
      saveEmbedCollapsed(props.surface, embedCardKey(embed, index), true);
    });
    setCollapseRevision((value) => value + 1);
  }

  function renderEmbedCard(embed: SocialEmbed, listIndex: number, featured = false): ReactElement {
    const cardKey = embedCardKey(embed, listIndex);
    const collapsed = isEmbedCollapsed(props.surface, cardKey, embed.live === true);
    const resolved = resolveSocialEmbed(embed, parentHost);

    return (
      <article
        className={
          'embedded-social-card embedded-social-accordion-card is-' +
          embed.platform +
          (embed.live ? ' is-live-embed-card' : '') +
          (resolved.playable ? ' is-playable-embed-card' : '') +
          (collapsed ? ' is-embed-collapsed' : ' is-embed-expanded')
        }
        data-embed-key={cardKey + collapseRevision}
        key={cardKey}
      >
        <button
          aria-expanded={!collapsed}
          className="embedded-social-accordion-toggle"
          onClick={() => toggleEmbed(cardKey, embed.live === true)}
          type="button"
        >
          <div className="embedded-social-accordion-summary">
            <span className="mini-badge">{platformLabel(embed.platform)}</span>
            <strong>{embed.title}</strong>
            <small>{embed.handle}</small>
          </div>
          <div className="embedded-social-accordion-meta">
            {embed.live ? <strong className="embedded-live-pill">LIVE</strong> : null}
            <span aria-hidden="true" className="embedded-social-accordion-chevron">
              {collapsed ? '▸' : '▾'}
            </span>
          </div>
        </button>

        {!collapsed ? (
          <div className="embedded-social-accordion-body">
            <SocialEmbedPlayer embed={embed} featured={featured} surface={props.surface} />

            <div className="embedded-social-card-actions">
              <a
                className="profile-secondary-link embedded-social-open-external"
                href={resolved.externalUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open on {embed.platform === 'x' ? 'X' : embed.platform}
              </a>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className="panel embedded-social-panel" data-embedded-surface={props.surface}>
      <div className="profile-panel-heading embedded-social-panel-heading">
        <div>
          <h2>{props.title ?? 'Live & Social'}</h2>
          <p>
            {isMemberSurface
              ? 'Expand only the feeds you want — each source collapses to save space.'
              : 'Watch live broadcasts and social posts inline — no need to leave Nami.'}
          </p>
        </div>

        <div className="embedded-social-panel-actions">
          {canReportAbuse ? (
            <button
              className="nami-surface-button member-feed-report-abuse-button"
              onClick={() => {
                setReportNotice('');
                setReportDialogOpen(true);
              }}
              type="button"
            >
              Report abuse
            </button>
          ) : null}

          {feedEnabled && orderedEmbeds.length > 1 ? (
            <div className="embedded-feed-bulk-toggles">
              <button className="profile-secondary-link" onClick={expandAllEmbeds} type="button">
                Expand all
              </button>
              <button className="profile-secondary-link" onClick={collapseAllEmbeds} type="button">
                Collapse all
              </button>
            </div>
          ) : null}

          {props.showFeedSettings && props.onOpenFeedSettings ? (
            <button
              className="nami-surface-button embedded-feed-settings-button"
              onClick={props.onOpenFeedSettings}
              type="button"
            >
              Feed Settings
            </button>
          ) : null}

          {canConfigure && props.showFeedToggle !== false ? (
            <button
              aria-pressed={feedEnabled}
              className={
                'nami-surface-button embedded-feed-toggle' + (feedEnabled ? ' is-active-view' : '')
              }
              onClick={toggleFeed}
              type="button"
            >
              {feedEnabled ? 'Turn feeds off' : 'Turn feeds on'}
            </button>
          ) : null}
        </div>
      </div>

      {feedEnabled && orderedEmbeds.length > 0 ? (
        <p className="embedded-social-feed-count">
          {expandedCount} of {orderedEmbeds.length} feeds expanded
        </p>
      ) : null}

      {reportNotice ? <p className="report-pulse member-feed-report-notice">{reportNotice}</p> : null}

      {!feedEnabled ? (
        canConfigure ? (
          <div className="embedded-social-disabled-state">
            <p>Feeds are hidden from your profile and channel pages.</p>
            <button className="profile-secondary-link" onClick={toggleFeed} type="button">
              Enable feeds
            </button>
          </div>
        ) : (
          <div className="embedded-social-disabled-state">
            <p>Feeds are not published on this surface yet.</p>
          </div>
        )
      ) : (
        <div className="embedded-social-grid embedded-social-accordion">
          {orderedEmbeds.map((embed, index) => renderEmbedCard(embed, index, embed.live === true))}
        </div>
      )}

      {reportDialogOpen && feedOwner ? (
        <MemberFeedReportAbuseDialog
          feedOwnerMemberId={feedOwner.id}
          feedOwnerName={feedOwner.name}
          onClose={() => setReportDialogOpen(false)}
          onSubmitted={setReportNotice}
        />
      ) : null}
    </article>
  );
}
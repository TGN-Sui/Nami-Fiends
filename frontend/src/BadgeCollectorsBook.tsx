import { useEffect, useState, type ReactElement } from 'react';

import { collectedBadgesForMember, userCollectedBadges, type CollectedBadge } from './global-chats.js';

import { badgeGlyph } from './nami-badge-glyphs.js';
import { type NamiMember } from './uiMockData.js';

const SLOTS_PER_PAGE = 9;

function totalPagesFor(badgeCount: number): number {
  return Math.max(1, Math.ceil(badgeCount / SLOTS_PER_PAGE));
}

function formatClaimDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function pageSlots(pageIndex: number, badges: CollectedBadge[]): Array<CollectedBadge | null> {
  const start = pageIndex * SLOTS_PER_PAGE;

  return Array.from({ length: SLOTS_PER_PAGE }, (_, slotIndex) => {
    return badges[start + slotIndex] ?? null;
  });
}

function resolveBadges(member?: NamiMember, badges?: CollectedBadge[]): CollectedBadge[] {
  if (badges) {
    return badges;
  }

  if (member) {
    return collectedBadgesForMember(member);
  }

  return userCollectedBadges;
}

export function BadgeCollectorsBook(props: {
  member?: NamiMember;
  badges?: CollectedBadge[];
  ownerLabel?: string;
}): ReactElement {
  const badges = resolveBadges(props.member, props.badges);
  const totalPages = totalPagesFor(badges.length);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<CollectedBadge | null>(null);
  const slots = pageSlots(pageIndex, badges);

  useEffect(() => {
    setPageIndex(0);
    setSelectedBadge(null);
  }, [props.member?.id, badges.length]);

  function flipPage(direction: 'prev' | 'next'): void {
    setPageIndex((current) => {
      if (direction === 'prev') {
        return Math.max(0, current - 1);
      }

      return Math.min(totalPages - 1, current + 1);
    });
    setSelectedBadge(null);
  }

  return (
    <section className="badge-collectors-book tcg-binder-book" aria-label="Nami Badge Book">
      <div className="badge-book-cover">
        <h2>Nami Badge Book</h2>
      </div>

      <div className="badge-binder-shell">
        <button
          aria-label="Previous binder page"
          className="badge-binder-arrow badge-binder-arrow-left secondary-action"
          disabled={pageIndex === 0}
          onClick={() => flipPage('prev')}
          type="button"
        >
          ‹
        </button>

        <div className={'badge-binder-page badge-binder-page-' + (pageIndex + 1)}>
          <div className="badge-binder-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="badge-book-grid tcg-binder-grid">
            {slots.map((badge, index) => (
              <button
                className={
                  'badge-book-slot tcg-binder-slot' +
                  (badge ? ' has-badge is-rarity-' + badge.rarity : ' is-empty-slot') +
                  (selectedBadge?.id === badge?.id ? ' is-selected-badge-slot' : '')
                }
                key={'page-' + pageIndex + '-slot-' + index}
                onClick={() => setSelectedBadge(badge)}
                type="button"
              >
                {badge ? (
                  <>
                    <span className="badge-slot-foil" />
                    <span className="badge-glyph-mark">{badgeGlyph(badge)}</span>
                    <strong>{badge.name}</strong>
                    <small>{badge.rarity}</small>
                  </>
                ) : (
                  <span className="badge-empty-label">Open slot</span>
                )}
              </button>
            ))}
          </div>

          <div className="badge-binder-page-label">Page {pageIndex + 1}</div>
        </div>

        <button
          aria-label="Next binder page"
          className="badge-binder-arrow badge-binder-arrow-right secondary-action"
          disabled={pageIndex >= totalPages - 1}
          onClick={() => flipPage('next')}
          type="button"
        >
          ›
        </button>
      </div>

      {selectedBadge ? (
        <article className="panel badge-book-detail">
          <div className="badge-book-detail-head">
            <span className="badge-glyph-mark is-large">{badgeGlyph(selectedBadge)}</span>
            <h3>{selectedBadge.name}</h3>
          </div>
          <div className="badge-book-detail-grid">
            <span>Claimed</span>
            <strong>{formatClaimDate(selectedBadge.claimedAt)}</strong>
            <span>Collectors</span>
            <strong>{selectedBadge.collectorsCount.toLocaleString()} members</strong>
            <span>Rarity</span>
            <strong>{selectedBadge.rarity}</strong>
          </div>
        </article>
      ) : null}
    </section>
  );
}
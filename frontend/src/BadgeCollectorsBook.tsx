import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

import { collectedBadgesForMember, userCollectedBadges, type CollectedBadge } from './global-chats.js';

import { badgeGlyph } from './nami-badge-glyphs.js';
import { type NamiMember } from './uiMockData.js';

const SLOTS_PER_FACE = 6;
const SLOTS_PER_SPREAD = SLOTS_PER_FACE * 2;
const COVER_OPEN_MS = 820;
const PAGE_FLIP_MS = 680;
const DRAG_FLIP_THRESHOLD = 0.34;

function totalSpreadsFor(badgeCount: number): number {
  return Math.max(1, Math.ceil(Math.max(badgeCount, 1) / SLOTS_PER_SPREAD));
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

function spreadFaces(
  spreadIndex: number,
  badges: CollectedBadge[]
): { left: Array<CollectedBadge | null>; right: Array<CollectedBadge | null> } {
  const start = spreadIndex * SLOTS_PER_SPREAD;

  return {
    left: Array.from({ length: SLOTS_PER_FACE }, (_, slotIndex) => badges[start + slotIndex] ?? null),
    right: Array.from(
      { length: SLOTS_PER_FACE },
      (_, slotIndex) => badges[start + SLOTS_PER_FACE + slotIndex] ?? null
    ),
  };
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

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function BadgeSlotButton(props: {
  badge: CollectedBadge | null;
  faceKey: string;
  slotIndex: number;
  selectedBadgeId?: string | undefined;
  onSelect: (badge: CollectedBadge | null) => void;
}): ReactElement {
  const { badge } = props;

  return (
    <button
      className={
        'badge-book-slot tcg-binder-slot' +
        (badge ? ' has-badge is-rarity-' + badge.rarity : ' is-empty-slot') +
        (props.selectedBadgeId === badge?.id ? ' is-selected-badge-slot' : '')
      }
      key={props.faceKey + '-slot-' + props.slotIndex}
      onClick={() => props.onSelect(badge)}
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
  );
}

function BadgeBookPageFace(props: {
  side: 'left' | 'right';
  slots: Array<CollectedBadge | null>;
  selectedBadgeId?: string | undefined;
  onSelect: (badge: CollectedBadge | null) => void;
  variant?: 'page' | 'cover' | 'back-cover';
  coverContent?: ReactNode;
}): ReactElement {
  const variant = props.variant ?? 'page';

  return (
    <div
      className={
        'badge-book-page-face is-' +
        props.side +
        '-face' +
        (variant === 'cover' ? ' is-cover-page' : '') +
        (variant === 'back-cover' ? ' is-back-cover-page' : '')
      }
    >
      <div className="badge-book-page-face-inner">
        {variant === 'cover' ? (
          <div className="badge-book-cover-content">{props.coverContent}</div>
        ) : variant === 'back-cover' ? (
          <div className="badge-book-back-cover-content" aria-hidden="true">
            <span className="badge-book-back-cover-mark">Nami</span>
          </div>
        ) : (
          <div className="badge-book-grid tcg-binder-grid">
            {props.slots.map((badge, index) => (
              <BadgeSlotButton
                badge={badge}
                faceKey={props.side}
                key={props.side + '-slot-' + index}
                onSelect={props.onSelect}
                selectedBadgeId={props.selectedBadgeId}
                slotIndex={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BadgeCollectorsBook(props: {
  member?: NamiMember;
  badges?: CollectedBadge[];
  ownerLabel?: string;
}): ReactElement {
  const badges = resolveBadges(props.member, props.badges);
  const totalSpreads = totalSpreadsFor(badges.length);
  const [bookOpen, setBookOpen] = useState(false);
  const [coverOpening, setCoverOpening] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<CollectedBadge | null>(null);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [flipProgress, setFlipProgress] = useState(0);
  const [isDraggingFlip, setIsDraggingFlip] = useState(false);
  const dragStartXRef = useRef(0);
  const flipFrameRef = useRef<number | null>(null);
  const spreadViewportRef = useRef<HTMLDivElement | null>(null);

  const currentSpread = spreadFaces(spreadIndex, badges);
  const nextSpreadIndex = flipDirection === 'next' ? Math.min(totalSpreads - 1, spreadIndex + 1) : spreadIndex;
  const prevSpreadIndex = flipDirection === 'prev' ? Math.max(0, spreadIndex - 1) : spreadIndex;
  const nextSpread = spreadFaces(nextSpreadIndex, badges);
  const prevSpread = spreadFaces(prevSpreadIndex, badges);

  useEffect(() => {
    return () => {
      if (flipFrameRef.current !== null) {
        window.cancelAnimationFrame(flipFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSpreadIndex(0);
    setSelectedBadge(null);
    setBookOpen(false);
    setCoverOpening(false);
    setFlipDirection(null);
    setFlipProgress(0);
    setIsDraggingFlip(false);
  }, [props.member?.id, badges.length]);

  function openBook(): void {
    if (bookOpen || coverOpening) {
      return;
    }

    setCoverOpening(true);
    window.setTimeout(() => {
      setBookOpen(true);
      setCoverOpening(false);
    }, COVER_OPEN_MS);
  }

  function closeBook(): void {
    if (flipFrameRef.current !== null) {
      window.cancelAnimationFrame(flipFrameRef.current);
      flipFrameRef.current = null;
    }

    setBookOpen(false);
    setCoverOpening(false);
    setSpreadIndex(0);
    setSelectedBadge(null);
    setFlipDirection(null);
    setFlipProgress(0);
    setIsDraggingFlip(false);
  }

  function runFlipAnimation(direction: 'next' | 'prev', startProgress = 0): void {
    if (flipFrameRef.current !== null) {
      window.cancelAnimationFrame(flipFrameRef.current);
    }

    const targetIndex = direction === 'next' ? spreadIndex + 1 : spreadIndex - 1;

    if (targetIndex < 0 || targetIndex >= totalSpreads) {
      setFlipDirection(null);
      setFlipProgress(0);
      setIsDraggingFlip(false);
      return;
    }

    setFlipDirection(direction);
    setSelectedBadge(null);

    const startedAt = performance.now();
    const startValue = startProgress;

    function frame(now: number): void {
      const linear = Math.min(1, startValue + (now - startedAt) / PAGE_FLIP_MS);
      const eased = startValue + (easeInOutCubic(linear) - easeInOutCubic(startValue)) / (1 - startValue || 1);

      setFlipProgress(eased);

      if (linear < 1) {
        flipFrameRef.current = window.requestAnimationFrame(frame);
        return;
      }

      setSpreadIndex(targetIndex);
      setFlipDirection(null);
      setFlipProgress(0);
      setIsDraggingFlip(false);
      flipFrameRef.current = null;
    }

    flipFrameRef.current = window.requestAnimationFrame(frame);
  }

  function flipSpread(direction: 'prev' | 'next'): void {
    if (flipDirection || coverOpening || !bookOpen) {
      return;
    }

    runFlipAnimation(direction, 0);
  }

  function pageWidth(): number {
    const viewport = spreadViewportRef.current;

    if (!viewport) {
      return 280;
    }

    return Math.max(180, (viewport.clientWidth - 14) / 2);
  }

  function handleSpreadWheel(event: React.WheelEvent<HTMLDivElement>): void {
    if (!bookOpen || flipDirection) {
      return;
    }

    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (delta > 12) {
      flipSpread('next');
    } else if (delta < -12) {
      flipSpread('prev');
    }
  }

  function handleSpreadPointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (!bookOpen || flipDirection) {
      return;
    }

    dragStartXRef.current = event.clientX;
    setIsDraggingFlip(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSpreadPointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    if (!isDraggingFlip || flipDirection) {
      return;
    }

    const delta = event.clientX - dragStartXRef.current;
    const normalized = Math.abs(delta) / pageWidth();

    if (delta < 0 && spreadIndex < totalSpreads - 1) {
      setFlipDirection('next');
      setFlipProgress(Math.min(1, normalized));
      return;
    }

    if (delta > 0 && spreadIndex > 0) {
      setFlipDirection('prev');
      setFlipProgress(Math.min(1, normalized));
    }
  }

  function finishSpreadDrag(event: React.PointerEvent<HTMLDivElement>): void {
    if (!isDraggingFlip) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDraggingFlip(false);

    if (!flipDirection) {
      return;
    }

    if (flipProgress >= DRAG_FLIP_THRESHOLD) {
      runFlipAnimation(flipDirection, flipProgress);
      return;
    }

    const rewindDirection = flipDirection;
    const rewindFrom = flipProgress;
    setFlipDirection(null);
    setFlipProgress(0);

    if (rewindFrom <= 0.02) {
      return;
    }

    const startedAt = performance.now();

    function rewindFrame(now: number): void {
      const linear = Math.min(1, (now - startedAt) / 220);
      const progress = rewindFrom * (1 - linear);

      if (linear < 1) {
        setFlipDirection(rewindDirection);
        setFlipProgress(progress);
        flipFrameRef.current = window.requestAnimationFrame(rewindFrame);
        return;
      }

      setFlipDirection(null);
      setFlipProgress(0);
      flipFrameRef.current = null;
    }

    flipFrameRef.current = window.requestAnimationFrame(rewindFrame);
  }

  const coverContent = (
    <>
      <span className="badge-book-cover-ornament" aria-hidden="true" />
      <span className="badge-book-cover-kicker">Collector Edition</span>
      <h2>Nami Badges</h2>
      {props.ownerLabel ? <p>{props.ownerLabel}</p> : null}
      <span className="badge-book-cover-cta">{coverOpening ? 'Opening…' : 'Tap to open'}</span>
    </>
  );

  const showSpread = bookOpen || coverOpening;
  const flipAngle = flipDirection === 'next' ? -flipProgress * 180 : flipDirection === 'prev' ? flipProgress * 180 : 0;

  return (
    <section
      aria-label="Nami Badge Book"
      className={
        'badge-collectors-book badge-book-interactive tcg-binder-book' +
        (bookOpen ? ' is-book-open' : '') +
        (coverOpening ? ' is-book-opening' : '') +
        (flipDirection ? ' is-page-flipping' : '')
      }
    >
      <div className="badge-book-stage">
        {showSpread ? (
          <div
            className={
              'badge-book-open-layer' + (bookOpen && !coverOpening ? ' is-book-fully-open' : ' is-book-revealing')
            }
          >
            <div
              className="badge-book-spread-viewport"
              onWheel={handleSpreadWheel}
              ref={spreadViewportRef}
            >
              <div
                className={
                  'badge-book-spread' + (isDraggingFlip || flipDirection ? ' is-dragging-spread' : '')
                }
                onPointerCancel={finishSpreadDrag}
                onPointerDown={handleSpreadPointerDown}
                onPointerMove={handleSpreadPointerMove}
                onPointerUp={finishSpreadDrag}
              >
                <div className="badge-book-left-slot">
                  {flipDirection === 'prev' && flipProgress > 0 ? (
                    <BadgeBookPageFace
                      onSelect={setSelectedBadge}
                      selectedBadgeId={selectedBadge?.id}
                      side="left"
                      slots={prevSpread.left}
                    />
                  ) : (
                    <BadgeBookPageFace
                      onSelect={setSelectedBadge}
                      selectedBadgeId={selectedBadge?.id}
                      side="left"
                      slots={currentSpread.left}
                    />
                  )}

                  {flipDirection === 'prev' && flipProgress > 0 ? (
                    <div
                      className="badge-book-page-flip is-flip-backward"
                      style={{ transform: 'rotateY(' + String(flipAngle) + 'deg)' }}
                    >
                      <div className="badge-book-page-flip-face is-flip-front">
                        <BadgeBookPageFace
                          onSelect={setSelectedBadge}
                          selectedBadgeId={selectedBadge?.id}
                          side="left"
                          slots={currentSpread.left}
                        />
                      </div>
                      <div className="badge-book-page-flip-face is-flip-back">
                        <BadgeBookPageFace
                          onSelect={setSelectedBadge}
                          selectedBadgeId={selectedBadge?.id}
                          side="right"
                          slots={prevSpread.right}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div aria-hidden="true" className="badge-book-spine-gutter">
                  <span />
                </div>

                <div className="badge-book-right-slot">
                  {flipDirection === 'next' && flipProgress > 0 ? (
                    <BadgeBookPageFace
                      onSelect={setSelectedBadge}
                      selectedBadgeId={selectedBadge?.id}
                      side="right"
                      slots={nextSpread.right}
                    />
                  ) : (
                    <BadgeBookPageFace
                      onSelect={setSelectedBadge}
                      selectedBadgeId={selectedBadge?.id}
                      side="right"
                      slots={currentSpread.right}
                    />
                  )}

                  {flipDirection === 'next' && flipProgress > 0 ? (
                    <div
                      className="badge-book-page-flip is-flip-forward"
                      style={{ transform: 'rotateY(' + String(flipAngle) + 'deg)' }}
                    >
                      <div className="badge-book-page-flip-face is-flip-front">
                        <BadgeBookPageFace
                          onSelect={setSelectedBadge}
                          selectedBadgeId={selectedBadge?.id}
                          side="right"
                          slots={currentSpread.right}
                        />
                      </div>
                      <div className="badge-book-page-flip-face is-flip-back">
                        <BadgeBookPageFace
                          onSelect={setSelectedBadge}
                          selectedBadgeId={selectedBadge?.id}
                          side="left"
                          slots={nextSpread.left}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {bookOpen ? (
              <div className="badge-book-open-controls">
                <button
                  aria-label="Previous spread"
                  className="badge-book-flip-button secondary-action"
                  disabled={spreadIndex === 0 || Boolean(flipDirection)}
                  onClick={() => flipSpread('prev')}
                  type="button"
                >
                  ‹
                </button>
                <p className="badge-book-page-hint">
                  Spread {spreadIndex + 1} of {totalSpreads} · drag or scroll to flip
                </p>
                <button
                  aria-label="Next spread"
                  className="badge-book-flip-button secondary-action"
                  disabled={spreadIndex >= totalSpreads - 1 || Boolean(flipDirection)}
                  onClick={() => flipSpread('next')}
                  type="button"
                >
                  ›
                </button>
                <button className="badge-book-close-button secondary-action" onClick={closeBook} type="button">
                  Close book
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!bookOpen || coverOpening ? (
          <div className={'badge-book-closed-shell' + (coverOpening ? ' is-cover-opening' : '')}>
            {coverOpening ? (
              <div aria-hidden="true" className="badge-book-opening-slot" />
            ) : (
              <BadgeBookPageFace side="left" slots={[]} variant="back-cover" onSelect={() => undefined} />
            )}
            <div aria-hidden="true" className="badge-book-spine-gutter">
              <span />
            </div>
            <button
              aria-expanded={bookOpen}
              aria-label="Open Nami Badges book"
              className="badge-book-front-cover"
              disabled={coverOpening}
              onClick={openBook}
              type="button"
            >
              <BadgeBookPageFace
                coverContent={coverContent}
                onSelect={() => undefined}
                side="right"
                slots={[]}
                variant="cover"
              />
            </button>
          </div>
        ) : null}
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
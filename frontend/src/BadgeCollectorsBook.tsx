import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import {
  BADGE_BOOK_LIFT_MS,
  badgeBookLiftTransform,
  badgeBookSpreadCssVars,
  computeBadgeBookLiftFrames,
  computeBadgeBookOpenPose,
  computeBadgeBookSpreadLayout,
  interpolateLiftFrame,
  prefersReducedBadgeBookMotion,
  readBadgeBookLiftHandoffTarget,
  type BadgeBookLiftFrame,
  type BadgeBookLiftTarget,
} from './badge-book-lift.js';
import { BadgeBookOverlay } from './BadgeBookOverlay.js';
import { releaseExpandedChatScrollLock } from './ExpandedChatOverlay.js';
import { collectedBadgesForMember, userCollectedBadges, type CollectedBadge } from './global-chats.js';

import { badgeGlyph } from './nami-badge-glyphs.js';
import { ownerAssetBadgeSlotId } from './nami-owner-assets-store.js';
import { OwnerEditableImage } from './OwnerEditableImage.js';
import { type NamiMember } from './uiMockData.js';

const SLOTS_PER_FACE = 6;
const SLOTS_PER_SPREAD = SLOTS_PER_FACE * 2;
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
          <OwnerEditableImage
            className="badge-glyph-editable"
            fallback={<span className="badge-glyph-mark">{badgeGlyph(badge)}</span>}
            imageClassName="badge-glyph-image"
            label={badge.name + ' badge'}
            nested
            slotId={ownerAssetBadgeSlotId(badge.name)}
          />
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
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [liftActive, setLiftActive] = useState(false);
  const [liftHandoff, setLiftHandoff] = useState(false);
  const [handoffTarget, setHandoffTarget] = useState<BadgeBookLiftTarget | null>(null);
  const [liftFrame, setLiftFrame] = useState<BadgeBookLiftFrame | null>(null);
  const [liftOpenProgress, setLiftOpenProgress] = useState(0);
  const [liftTarget, setLiftTarget] = useState<BadgeBookLiftTarget | null>(null);
  const [sourceHidden, setSourceHidden] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<CollectedBadge | null>(null);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [flipProgress, setFlipProgress] = useState(0);
  const [isDraggingFlip, setIsDraggingFlip] = useState(false);
  const dragStartXRef = useRef(0);
  const flipFrameRef = useRef<number | null>(null);
  const spreadViewportRef = useRef<HTMLDivElement | null>(null);
  const coverStackRef = useRef<HTMLDivElement | null>(null);
  const liftTimeoutRef = useRef<number | null>(null);
  const liftFrameRef = useRef<number | null>(null);
  const liftFinishingRef = useRef(false);
  const liftTargetRef = useRef<BadgeBookLiftTarget | null>(null);
  const liftSpreadTargetRef = useRef<BadgeBookLiftTarget | null>(null);
  const liftKeyframesRef = useRef<{ from: BadgeBookLiftFrame; to: BadgeBookLiftFrame } | null>(null);
  const liftHandoffMeasureRef = useRef<HTMLDivElement | null>(null);

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

      if (liftTimeoutRef.current !== null) {
        window.clearTimeout(liftTimeoutRef.current);
      }

      if (liftFrameRef.current !== null) {
        window.cancelAnimationFrame(liftFrameRef.current);
      }

      releaseExpandedChatScrollLock();
    };
  }, []);

  useEffect(() => {
    setSpreadIndex(0);
    setSelectedBadge(null);
    setOverlayOpen(false);
    setLiftActive(false);
    setLiftHandoff(false);
    setHandoffTarget(null);
    setLiftFrame(null);
    setLiftOpenProgress(0);
    setLiftTarget(null);
    setSourceHidden(false);
    setFlipDirection(null);
    setFlipProgress(0);
    setIsDraggingFlip(false);
  }, [props.member?.id, badges.length]);

  function resetBookState(): void {
    if (flipFrameRef.current !== null) {
      window.cancelAnimationFrame(flipFrameRef.current);
      flipFrameRef.current = null;
    }

    setSpreadIndex(0);
    setSelectedBadge(null);
    setFlipDirection(null);
    setFlipProgress(0);
    setIsDraggingFlip(false);
  }

  function clearLiftState(): void {
    if (liftTimeoutRef.current !== null) {
      window.clearTimeout(liftTimeoutRef.current);
      liftTimeoutRef.current = null;
    }

    setLiftActive(false);
    setLiftHandoff(false);
    setHandoffTarget(null);
    setLiftFrame(null);
    setLiftOpenProgress(0);
    setLiftTarget(null);
    liftTargetRef.current = null;
    liftSpreadTargetRef.current = null;
    liftKeyframesRef.current = null;
    setSourceHidden(false);

    if (liftFrameRef.current !== null) {
      window.cancelAnimationFrame(liftFrameRef.current);
      liftFrameRef.current = null;
    }

    releaseExpandedChatScrollLock();
  }

  function finishLiftHandoff(
    spreadTarget: BadgeBookLiftTarget | null = liftSpreadTargetRef.current
  ): void {
    if (liftFinishingRef.current) {
      return;
    }

    liftFinishingRef.current = true;

    const fallbackTarget = spreadTarget ?? liftSpreadTargetRef.current;

    if (!fallbackTarget) {
      setOverlayOpen(true);
      return;
    }

    const handoffTarget = readBadgeBookLiftHandoffTarget(
      liftHandoffMeasureRef.current,
      fallbackTarget
    );

    setHandoffTarget(handoffTarget);
    setLiftHandoff(true);
    setOverlayOpen(true);
    setLiftActive(false);
    setLiftFrame(null);
    setLiftOpenProgress(0);
    setLiftTarget(null);
    liftTargetRef.current = null;
    liftSpreadTargetRef.current = null;
    liftKeyframesRef.current = null;
    setSourceHidden(false);

    if (liftFrameRef.current !== null) {
      window.cancelAnimationFrame(liftFrameRef.current);
      liftFrameRef.current = null;
    }
  }

  function runLiftAnimation(layout: ReturnType<typeof computeBadgeBookSpreadLayout>): void {
    const keyframes = liftKeyframesRef.current;

    if (!keyframes) {
      finishLiftHandoff(layout.spread);
      return;
    }

    const fromFrame = keyframes.from;
    const toFrame = keyframes.to;
    const startedAt = performance.now();

    function frame(now: number): void {
      const linear = Math.min(1, (now - startedAt) / BADGE_BOOK_LIFT_MS);
      const eased = easeInOutCubic(linear);
      const pose = computeBadgeBookOpenPose(eased);

      setLiftOpenProgress(eased);
      setLiftFrame(interpolateLiftFrame(fromFrame, toFrame, pose.layoutProgress));

      if (linear < 1) {
        liftFrameRef.current = window.requestAnimationFrame(frame);
        return;
      }

      liftFrameRef.current = null;

      if (liftTimeoutRef.current !== null) {
        window.clearTimeout(liftTimeoutRef.current);
        liftTimeoutRef.current = null;
      }

      finishLiftHandoff(layout.spread);
    }

    liftFrameRef.current = window.requestAnimationFrame(frame);
  }

  function openBook(): void {
    if (overlayOpen || liftActive) {
      return;
    }

    liftFinishingRef.current = false;
    resetBookState();

    if (prefersReducedBadgeBookMotion()) {
      setOverlayOpen(true);
      return;
    }

    const source = coverStackRef.current?.getBoundingClientRect();

    if (!source) {
      setOverlayOpen(true);
      return;
    }

    const layout = computeBadgeBookSpreadLayout();
    const frames = computeBadgeBookLiftFrames(source, layout.spread);

    document.body.style.overflow = 'hidden';
    liftTargetRef.current = layout.spread;
    liftSpreadTargetRef.current = layout.spread;
    liftKeyframesRef.current = frames;
    setLiftTarget(layout.spread);
    setLiftFrame(frames.from);
    setLiftOpenProgress(0);
    setSourceHidden(true);
    setLiftActive(true);

    window.requestAnimationFrame(() => {
      runLiftAnimation(layout);
    });

    liftTimeoutRef.current = window.setTimeout(() => {
      liftTimeoutRef.current = null;
      finishLiftHandoff(layout.spread);
    }, BADGE_BOOK_LIFT_MS + 80);
  }

  function closeBook(): void {
    liftFinishingRef.current = false;
    resetBookState();
    clearLiftState();
    setOverlayOpen(false);
    setLiftHandoff(false);
    setHandoffTarget(null);
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
    if (flipDirection || !overlayOpen) {
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
    if (!overlayOpen || flipDirection) {
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
    if (!overlayOpen || flipDirection) {
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
      <span className="badge-book-cover-cta">Tap to open</span>
    </>
  );

  const flipAngle = flipDirection === 'next' ? -flipProgress * 180 : flipDirection === 'prev' ? flipProgress * 180 : 0;
  const liftPose = liftActive ? computeBadgeBookOpenPose(liftOpenProgress) : null;

  const liftPortal =
    liftActive && liftTarget && liftFrame && liftPose
      ? createPortal(
          <div aria-hidden="true" className="badge-book-lift-host">
            <div className="badge-book-lift-backdrop" />
            <div
              className="badge-book-lift-frame"
              style={{
                left: liftTarget.left,
                top: liftTarget.top,
                width: liftTarget.width,
                height: liftTarget.height,
                ...badgeBookSpreadCssVars(liftTarget),
              }}
            >
              <div
                className="badge-book-lift-motion"
                style={{ transform: badgeBookLiftTransform(liftFrame) }}
              >
                <div className="badge-book-open-scene" ref={liftHandoffMeasureRef}>
                  <div
                    className="badge-book-lift-left-page"
                    style={{
                      transform: 'rotateY(' + String(liftPose.leftPageRotateY) + 'deg)',
                      opacity: liftPose.leftPageOpacity,
                    }}
                  >
                    <BadgeBookPageFace
                      onSelect={() => undefined}
                      side="left"
                      slots={currentSpread.left}
                    />
                  </div>

                  <div aria-hidden="true" className="badge-book-spine-gutter">
                    <span />
                  </div>

                  <div className="badge-book-lift-right-slot">
                    <BadgeBookPageFace
                      onSelect={() => undefined}
                      side="right"
                      slots={currentSpread.right}
                    />
                    <div
                      className="badge-book-lift-cover-flip"
                      style={{
                        transform: 'rotateY(' + String(liftPose.coverRotateY) + 'deg)',
                        opacity: liftPose.coverOpacity,
                      }}
                    >
                      <BadgeBookPageFace
                        coverContent={coverContent}
                        onSelect={() => undefined}
                        side="right"
                        slots={[]}
                        variant="cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {liftPortal}
      <section
        aria-label="Nami Badge Book"
        className={
          'badge-collectors-book badge-book-interactive tcg-binder-book' +
          (flipDirection ? ' is-page-flipping' : '')
        }
      >
        <div className="badge-book-stage">
          <div
            className={
              'badge-book-cover-preview' + (sourceHidden ? ' is-source-lifted' : '')
            }
          >
            <div className="badge-book-cover-stack" ref={coverStackRef}>
              <span aria-hidden="true" className="badge-book-cover-page-edge is-page-edge-3" />
              <span aria-hidden="true" className="badge-book-cover-page-edge is-page-edge-2" />
              <span aria-hidden="true" className="badge-book-cover-page-edge is-page-edge-1" />
              <button
                aria-expanded={overlayOpen}
                aria-haspopup="dialog"
                aria-label="Open Nami Badges book"
                className="badge-book-front-cover"
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
          </div>
        </div>
      </section>

      <BadgeBookOverlay
        handoffFromLift={liftHandoff}
        handoffTarget={handoffTarget}
        label="Nami Badge Book"
        onClose={closeBook}
        open={overlayOpen}
      >
        <div
          className={
            'badge-book-overlay-panel' + (flipDirection ? ' is-page-flipping' : '')
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
        </div>
      </BadgeBookOverlay>
    </>
  );
}
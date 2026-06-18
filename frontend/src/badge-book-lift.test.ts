import { describe, expect, it } from 'vitest';

import {
  BADGE_BOOK_OPEN_COVER_PHASE,
  badgeBookSpreadCssVars,
  computeBadgeBookLiftFrames,
  readBadgeBookLiftHandoffTarget,
  computeBadgeBookOpenPose,
  computeBadgeBookPageWidth,
  interpolateLiftFrame,
} from './badge-book-lift.js';

describe('computeBadgeBookLiftFrames', () => {
  it('maps the cover rect onto the right page of the popup spread', () => {
    const source = {
      left: 120,
      top: 200,
      width: 340,
      height: 400,
    } as DOMRect;
    const spread = { left: 100, top: 80, width: 920, height: 620 };
    const pageWidth = computeBadgeBookPageWidth(spread.width);
    const frames = computeBadgeBookLiftFrames(source, spread);

    expect(pageWidth).toBeCloseTo(453, 5);
    expect(frames.from.scaleX).toBeCloseTo(340 / pageWidth, 5);
    expect(frames.from.scaleY).toBeCloseTo(400 / 620, 5);
    expect(frames.to.scaleX).toBe(1);
    expect(frames.to.scaleY).toBe(1);
    expect(frames.to.rotateY).toBe(0);
  });
});

describe('computeBadgeBookOpenPose', () => {
  it('opens the cover halfway before the left page starts moving', () => {
    const coverMid = computeBadgeBookOpenPose(BADGE_BOOK_OPEN_COVER_PHASE * 0.5);
    const beforeHalf = computeBadgeBookOpenPose(BADGE_BOOK_OPEN_COVER_PHASE - 0.001);
    const coverHalf = computeBadgeBookOpenPose(BADGE_BOOK_OPEN_COVER_PHASE);
    const leftStart = computeBadgeBookOpenPose(BADGE_BOOK_OPEN_COVER_PHASE + 0.001);
    const open = computeBadgeBookOpenPose(1);

    expect(coverMid.coverRotateY).toBeLessThan(-30);
    expect(coverMid.leftPageRotateY).toBe(90);
    expect(coverMid.leftPageOpacity).toBe(0);
    expect(beforeHalf.leftPageOpacity).toBe(0);
    expect(coverHalf.coverRotateY).toBeCloseTo(-90, 0);
    expect(coverHalf.leftPageRotateY).toBe(90);
    expect(coverHalf.leftPageOpacity).toBe(1);
    expect(leftStart.leftPageRotateY).toBeLessThan(90);
    expect(leftStart.leftPageOpacity).toBe(1);
    expect(open.coverRotateY).toBeCloseTo(-180, 0);
    expect(open.leftPageRotateY).toBeCloseTo(0, 0);
    expect(open.leftPageOpacity).toBe(1);
    expect(open.coverOpacity).toBe(0);
    expect(open.layoutProgress).toBe(1);
  });
});

describe('readBadgeBookLiftHandoffTarget', () => {
  it('uses the rendered lift scene rect when available', () => {
    const fallback = { left: 10, top: 20, width: 920, height: 620 };
    const node = {
      getBoundingClientRect: () => ({
        left: 112.5,
        top: 84.25,
        width: 918.5,
        height: 617.75,
      }),
    } as HTMLElement;

    expect(readBadgeBookLiftHandoffTarget(node, fallback)).toEqual({
      left: 112.5,
      top: 84.25,
      width: 918.5,
      height: 617.75,
    });
  });

  it('falls back when the lift scene is missing or collapsed', () => {
    const fallback = { left: 10, top: 20, width: 920, height: 620 };

    expect(readBadgeBookLiftHandoffTarget(null, fallback)).toBe(fallback);
    expect(
      readBadgeBookLiftHandoffTarget(
        {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
        } as HTMLElement,
        fallback
      )
    ).toBe(fallback);
  });
});

describe('badgeBookSpreadCssVars', () => {
  it('exports the animated spread dimensions as css variables', () => {
    const spread = { left: 100, top: 80, width: 920, height: 620 };

    expect(badgeBookSpreadCssVars(spread)).toEqual({
      '--badge-book-handoff-width': '920px',
      '--badge-book-handoff-height': '620px',
      '--badge-book-page-width': '453px',
    });
  });
});

describe('interpolateLiftFrame', () => {
  it('lerps between lift keyframes', () => {
    const from = {
      translateX: 40,
      translateY: -20,
      scaleX: 0.75,
      scaleY: 0.65,
      rotateY: 0,
    };
    const to = {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotateY: 0,
    };
    const mid = interpolateLiftFrame(from, to, 0.5);

    expect(mid.translateX).toBe(20);
    expect(mid.translateY).toBe(-10);
    expect(mid.scaleX).toBeCloseTo(0.875, 5);
    expect(mid.scaleY).toBeCloseTo(0.825, 5);
  });
});
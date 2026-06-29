import { type CSSProperties, type ReactElement } from 'react';

export const MEMBER_TIER_PRO_BUBBLE_SPACING_PX = 16;
export const MEMBER_TIER_PRO_BUBBLE_COUNT = 5;
export const MEMBER_TIER_PRO_BUBBLE_CYCLE_PX =
  MEMBER_TIER_PRO_BUBBLE_SPACING_PX * MEMBER_TIER_PRO_BUBBLE_COUNT;

export const memberTierProBubbleLayout = [
  { left: '14%', size: 11 },
  { left: '72%', size: 8 },
  { left: '38%', size: 13 },
  { left: '56%', size: 7 },
  { left: '24%', size: 10 },
] as const;

export const MEMBER_TIER_ELITE_GLITTER_SPACING_PX = 12;
export const MEMBER_TIER_ELITE_GLITTER_COUNT = 8;
export const MEMBER_TIER_ELITE_GLITTER_CYCLE_PX =
  MEMBER_TIER_ELITE_GLITTER_SPACING_PX * MEMBER_TIER_ELITE_GLITTER_COUNT;

export const memberTierEliteGlitterLayout = [
  { left: '11%', width: 2, height: 7, rotate: 24, delay: 0 },
  { left: '78%', width: 3, height: 5, rotate: -38, delay: -0.6 },
  { left: '34%', width: 2, height: 9, rotate: 12, delay: -1.1 },
  { left: '62%', width: 2, height: 6, rotate: -18, delay: -1.8 },
  { left: '48%', width: 3, height: 4, rotate: 42, delay: -2.4 },
  { left: '22%', width: 2, height: 8, rotate: -28, delay: -3.1 },
  { left: '86%', width: 2, height: 6, rotate: 16, delay: -3.8 },
  { left: '56%', width: 2, height: 7, rotate: -44, delay: -4.5 },
] as const;

type TierEffectKeyPrefix = string;

export function MemberTierBubbleLane(props: {
  keyPrefix?: TierEffectKeyPrefix;
  bubbleClassName?: string;
  laneClassName?: string;
  loopClassName?: string;
  passClassName?: string;
}): ReactElement {
  const keyPrefix = props.keyPrefix ?? 'tier-bubble';
  const laneClassName = props.laneClassName ?? 'member-spotlight-bubble-lane';
  const loopClassName = props.loopClassName ?? 'member-spotlight-bubble-loop';
  const passClassName = props.passClassName ?? 'member-spotlight-bubble-pass';
  const bubbleClassName = props.bubbleClassName ?? 'member-spotlight-float-bubble';

  return (
    <span
      aria-hidden="true"
      className={laneClassName}
      style={
        {
          '--member-spotlight-bubble-cycle': String(MEMBER_TIER_PRO_BUBBLE_CYCLE_PX) + 'px',
          '--member-spotlight-bubble-spacing': String(MEMBER_TIER_PRO_BUBBLE_SPACING_PX) + 'px',
        } as CSSProperties
      }
    >
      <span className={loopClassName}>
        {[0, 1].map((passIndex) => (
          <span className={passClassName} key={keyPrefix + '-pass-' + passIndex}>
            {memberTierProBubbleLayout.map((bubble, bubbleIndex) => (
              <i
                className={bubbleClassName}
                key={keyPrefix + '-' + passIndex + '-' + bubbleIndex}
                style={
                  {
                    left: bubble.left,
                    top: String(bubbleIndex * MEMBER_TIER_PRO_BUBBLE_SPACING_PX) + 'px',
                    width: String(bubble.size) + 'px',
                    height: String(bubble.size) + 'px',
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}

export function MemberTierGlitterLane(props: {
  keyPrefix?: TierEffectKeyPrefix;
  glitterClassName?: string;
  laneClassName?: string;
  loopClassName?: string;
  passClassName?: string;
}): ReactElement {
  const keyPrefix = props.keyPrefix ?? 'tier-glitter';
  const laneClassName = props.laneClassName ?? 'member-spotlight-glitter-lane';
  const loopClassName = props.loopClassName ?? 'member-spotlight-glitter-loop';
  const passClassName = props.passClassName ?? 'member-spotlight-glitter-pass';
  const glitterClassName = props.glitterClassName ?? 'member-spotlight-glitter-shard';

  return (
    <span
      aria-hidden="true"
      className={laneClassName}
      style={
        {
          '--member-spotlight-glitter-cycle': String(MEMBER_TIER_ELITE_GLITTER_CYCLE_PX) + 'px',
          '--member-spotlight-glitter-spacing': String(MEMBER_TIER_ELITE_GLITTER_SPACING_PX) + 'px',
        } as CSSProperties
      }
    >
      <span className={loopClassName}>
        {[0, 1].map((passIndex) => (
          <span className={passClassName} key={keyPrefix + '-pass-' + passIndex}>
            {memberTierEliteGlitterLayout.map((glitter, glitterIndex) => (
              <i
                className={glitterClassName}
                key={keyPrefix + '-' + passIndex + '-' + glitterIndex}
                style={
                  {
                    left: glitter.left,
                    top: String(glitterIndex * MEMBER_TIER_ELITE_GLITTER_SPACING_PX) + 'px',
                    width: String(glitter.width) + 'px',
                    height: String(glitter.height) + 'px',
                    '--member-spotlight-glitter-rotate': String(glitter.rotate) + 'deg',
                    '--member-spotlight-glitter-delay': String(glitter.delay) + 's',
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
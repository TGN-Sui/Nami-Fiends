import type { ReactElement } from 'react';

import {
  legendReviewPickerOptions,
  resolveLegendReviewMeter,
} from './legend-review-meter.js';

type LegendReviewMeterProps = {
  value: number;
  onChange?: (value: number) => void;
  compact?: boolean;
  showValue?: boolean;
  className?: string;
};

export function LegendReviewMeter(props: LegendReviewMeterProps): ReactElement {
  const display = resolveLegendReviewMeter(props.value);
  const interactive = typeof props.onChange === 'function';
  const tiers = legendReviewPickerOptions();

  return (
    <div
      className={
        'legend-review-meter' +
        (props.compact ? ' is-compact-legend-review-meter' : '') +
        (display.isLegend ? ' is-legend-tier' : '') +
        (interactive ? ' is-interactive-legend-review-meter' : '') +
        (props.className ? ' ' + props.className : '')
      }
    >
      <div className="legend-review-meter-head">
        <span className="legend-review-meter-label">{display.label}</span>
        {props.showValue !== false ? (
          <span className="legend-review-meter-value">{display.rating.toFixed(1)}</span>
        ) : null}
      </div>

      <div
        aria-label={interactive ? 'Choose a Legend recommendation' : display.ariaLabel}
        className="legend-review-meter-track-shell"
        role={interactive ? 'group' : 'img'}
      >
        <div aria-hidden="true" className="legend-review-meter-track">
          <div
            className={'legend-review-meter-fill' + (display.isLegend ? ' is-legend-fill' : '')}
            style={{ width: display.fillPercent + '%' }}
          />
        </div>

        {interactive ? (
          <div className="legend-review-meter-segments">
            {tiers.map((tier) => {
              const selected = Math.round(props.value) === tier.rating;

              return (
                <button
                  aria-label={tier.label + ' recommendation'}
                  aria-pressed={selected}
                  className={'legend-review-meter-segment' + (selected ? ' is-selected-legend-segment' : '')}
                  key={tier.rating}
                  onClick={() => props.onChange?.(tier.rating)}
                  type="button"
                >
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
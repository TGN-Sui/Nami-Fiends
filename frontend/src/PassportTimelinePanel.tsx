import { useMemo, useState, type ReactElement } from 'react';

import type { PassportTimelineProjection, TimelineCategory } from '@nami/sdk';

import {
  formatTimelineTimestamp,
  timelineCategoryLabel,
  timelineEntrySummary,
  timelineKindLabel,
} from './timeline-labels.js';

const FILTER_CATEGORIES: Array<TimelineCategory | 'all'> = [
  'all',
  'progression',
  'conduct',
  'customization',
  'verification',
  'moderation',
  'origin',
];

interface PassportTimelinePanelProps {
  timeline: PassportTimelineProjection | null;
}

export function PassportTimelinePanel(props: PassportTimelinePanelProps): ReactElement {
  const [filter, setFilter] = useState<TimelineCategory | 'all'>('all');

  const entries = useMemo(() => {
    const source = props.timeline?.entries ?? [];

    if (filter === 'all') {
      return [...source].reverse();
    }

    return source.filter((entry) => entry.category === filter).reverse();
  }, [props.timeline, filter]);

  if (!props.timeline || props.timeline.entries.length === 0) {
    return (
      <article className="panel protocol-timeline-card">
        <div className="profile-panel-heading">
          <h2>Passport Journey</h2>
          <p>
            Indexed timeline from on-chain events. Entries appear after the backend indexer
            processes protocol activity.
          </p>
        </div>
        <p className="protocol-hint">No indexed timeline entries yet for this passport.</p>
      </article>
    );
  }

  return (
    <article className="panel protocol-timeline-card">
      <div className="profile-panel-heading">
        <h2>Passport Journey</h2>
        <p>
          Event-derived history — progression, conduct, titles, and cosmetics indexed from the
          immutable event log.
        </p>
      </div>

      <div className="protocol-timeline-snapshot">
        <span>Snapshot</span>
        <strong>
          Lv {props.timeline.snapshot.level ?? '—'} · Tier {props.timeline.snapshot.tier ?? '—'} ·{' '}
          {props.timeline.entry_count} event(s)
        </strong>
      </div>

      <div className="protocol-timeline-filters" role="tablist" aria-label="Timeline categories">
        {FILTER_CATEGORIES.map((category) => (
          <button
            key={category}
            className={filter === category ? 'is-active' : ''}
            onClick={() => setFilter(category)}
            type="button"
          >
            {category === 'all' ? 'All' : timelineCategoryLabel(category)}
          </button>
        ))}
      </div>

      <ol className="protocol-timeline-list">
        {entries.map((entry) => (
          <li className="protocol-timeline-item" key={entry.id}>
            <div className="protocol-timeline-item-head">
              <strong>{timelineKindLabel(entry.kind)}</strong>
              <span className="mini-badge">{timelineCategoryLabel(entry.category)}</span>
            </div>
            <p>{timelineEntrySummary(entry)}</p>
            <small>{formatTimelineTimestamp(entry)}</small>
          </li>
        ))}
      </ol>
    </article>
  );
}
import { useEffect, useState, type ReactElement } from 'react';

import { formatViewerCurrentTime } from './universal-calendar.js';

export function ViewerTimezoneClock(props: {
  className?: string;
  label?: string;
  timezone: string;
}): ReactElement {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const formatted = formatViewerCurrentTime(props.timezone, now);
  const className = props.className ? ' ' + props.className : '';

  return (
    <time
      className={'viewer-timezone-clock' + className}
      dateTime={now.toISOString()}
      title={'Current time in ' + props.timezone}
    >
      {props.label ? <span className="viewer-timezone-clock-label">{props.label}</span> : null}
      <strong>{formatted}</strong>
    </time>
  );
}
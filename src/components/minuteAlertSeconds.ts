import { MINUTE_MS } from '../constants';

import type { CriticalPoint } from '../data/carriageSelectors';

const SECONDS_PER_MINUTE = 60;

/** Для каждой из 60 секунд минуты события — был ли в эту секунду алерт (алерты округляются до секунды). */
export function buildMinuteAlertSeconds(events: CriticalPoint[], eventTimestamp: number): boolean[] {
  const minuteStart = Math.floor(eventTimestamp / MINUTE_MS) * MINUTE_MS;

  const alertSeconds = new Set(events.map((event) => Math.floor(event.timestamp / 1000)));

  return Array.from({ length: SECONDS_PER_MINUTE }, (_, second) =>
    alertSeconds.has(Math.floor(minuteStart / 1000) + second),
  );
}

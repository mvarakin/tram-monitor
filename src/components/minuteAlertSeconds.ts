import { MINUTE_MS } from '../constants';

import type { CriticalPoint } from '../data/carriageSelectors';

export const SECONDS_PER_MINUTE = 60;

/** Для каждой из 60 секунд минуты события — был ли в эту секунду алерт (алерты округляются до секунды). */
export function buildMinuteAlertSeconds(events: CriticalPoint[], eventTimestamp: number): boolean[] {
  const minuteStart = Math.floor(eventTimestamp / MINUTE_MS) * MINUTE_MS;

  const alertSeconds = new Set(events.map((event) => Math.floor(event.timestamp / 1000)));

  return Array.from({ length: SECONDS_PER_MINUTE }, (_, second) =>
    alertSeconds.has(Math.floor(minuteStart / 1000) + second),
  );
}

/** Значение метрики по секундам минуты события. Если в секунде несколько замеров — остаётся
 * последний: кольцо и гистограмма должны показывать одно и то же число. */
export function buildMinuteSecondValues(events: CriticalPoint[], eventTimestamp: number): Map<number, number> {
  const minuteStartSec = Math.floor(Math.floor(eventTimestamp / MINUTE_MS) * MINUTE_MS / 1000);

  const secondValues = new Map<number, number>();

  for (const event of events) {
    const second = Math.floor(event.timestamp / 1000) - minuteStartSec;

    if (second >= 0 && second < SECONDS_PER_MINUTE) {
      secondValues.set(second, event.value);
    }
  }

  return secondValues;
}

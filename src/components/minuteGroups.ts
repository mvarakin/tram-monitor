import { MINUTE_MS } from '../constants';

import type { CriticalPoint } from '../data/carriageSelectors';

export function minuteBucket(timestamp: number): number {
  return Math.floor(timestamp / MINUTE_MS) * MINUTE_MS;
}

/** События одной батареи, сгруппированные по календарной минуте и отсортированные по времени. */
export function groupEventsByMinute(events: CriticalPoint[]): CriticalPoint[][] {
  const groups = new Map<number, CriticalPoint[]>();

  for (const event of [...events].sort((a, b) => a.timestamp - b.timestamp)) {
    const bucket = minuteBucket(event.timestamp);

    (groups.get(bucket) ?? groups.set(bucket, []).get(bucket)!).push(event);
  }

  return [...groups.values()];
}

/** Представитель группы для click/hover: событие с максимальным value (при равенстве — первое по времени). */
export function pickGroupRepresentative(group: CriticalPoint[]): CriticalPoint {
  return group.reduce((best, event) => (event.value > best.value ? event : best));
}

/** Все события той же календарной минуты, что и anchor (сам anchor включён). */
export function findMinuteGroup(events: CriticalPoint[], anchor: CriticalPoint): CriticalPoint[] {
  const bucket = minuteBucket(anchor.timestamp);

  return events.filter((event) => minuteBucket(event.timestamp) === bucket);
}

import { DAY_MS } from './constants';

/*
 * Границы календарного дня в локальной зоне, содержащего instantMs:
 * [00:00, 00:00 next day). Используется как домен графика.
 */
export function getLocalDayRange(instantMs: number): [number, number] {
  const offsetMs = new Date(instantMs).getTimezoneOffset() * 60_000;

  const localWallMs = instantMs - offsetMs;

  const dayStart = Math.floor(localWallMs / DAY_MS) * DAY_MS + offsetMs;

  return [dayStart, dayStart + DAY_MS];
}

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

/** instantMs → 'YYYY-MM-DD' в локальной таймзоне (значение для <input type="date">). */
export function toLocalDateInputValue(instantMs: number): string {
  const date = new Date(instantMs);
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 'YYYY-MM-DD' (локальная дата, как из <input type="date">) → instant локальной полуночи этого дня. */
export function parseLocalDateInputValue(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

import { DAY_MS } from '../constants';

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

/*
 * Метки времени внутри [from, to] с шагом stepMs, выровненные по локальной сетке:
 * подписи оси печатаются в локальной зоне, поэтому кратность считаем от неё,
 * а не от UTC — иначе в зонах с получасовым сдвигом часы съедят на HH:30.
 */
export function buildTimeTicks(from: number, to: number, stepMs: number): number[] {
  const offsetMs = new Date(from).getTimezoneOffset() * 60_000;

  const first = Math.ceil((from - offsetMs) / stepMs) * stepMs + offsetMs;

  const ticks: number[] = [];

  for (let tick = first; tick <= to; tick += stepMs) {
    ticks.push(tick);
  }

  return ticks;
}

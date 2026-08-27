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

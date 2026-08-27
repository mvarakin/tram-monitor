import { getBatteryColor } from './batteryColors';

import type { BatteryCriticalEvents, CriticalPoint } from '../data/carriageSelectors';

export const PANEL_WIDTH = 300;

/** Зазор между площадкой графика и панелью: в нём живут диагонали соединителей. */
export const PANEL_GAP = 60;

const TITLE_HEIGHT = 28;

const GROUP_HEADER_HEIGHT = 26;

const ROW_HEIGHT = 22;

const GROUP_GAP = 12;

/** Строка списка: событие, его вертикальная позиция и цвет своей батареи. */
export type EventRow = {
  battery: string;
  color: string;
  event: CriticalPoint;
  y: number;
};

export type EventGroup = {
  battery: string;
  color: string;
  count: number;
  y: number;
};

export type EventListLayout = {
  groups: EventGroup[];
  rows: EventRow[];
  total: number;
  width: number;
  height: number;
};

/*
 * Раскладка панели критических событий: группа на батарею, внутри группы — по времени.
 * Порядок батарей приходит снаружи и совпадает с легендой, поэтому цвет строки берётся
 * по тому же индексу, что и цвет линии на графике.
 *
 * Батарея без событий группы не получает. Если событий нет вообще — null: панели нет,
 * график остаётся во всю ширину.
 */
export function buildEventListLayout(
  batteries: string[],
  eventsByBattery: BatteryCriticalEvents,
): EventListLayout | null {
  const groups: EventGroup[] = [];

  const rows: EventRow[] = [];

  let y = TITLE_HEIGHT;

  batteries.forEach((battery, index) => {
    const events = eventsByBattery[battery] ?? [];

    if (events.length === 0) {
      return;
    }

    const color = getBatteryColor(index);

    groups.push({ battery, color, count: events.length, y });

    y += GROUP_HEADER_HEIGHT;

    for (const event of [...events].sort((a, b) => a.timestamp - b.timestamp)) {
      rows.push({ battery, color, event, y });

      y += ROW_HEIGHT;
    }

    y += GROUP_GAP;
  });

  if (rows.length === 0) {
    return null;
  }

  // Последний GROUP_GAP — воздух за нижней строкой, в высоту панели не входит.
  return {
    groups,
    rows,
    total: rows.length,
    width: PANEL_WIDTH,
    height: y - GROUP_GAP,
  };
}

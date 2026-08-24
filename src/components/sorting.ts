import type { Transport } from '../types/transport';

export type SortKey = 'name' | 'temperature' | 'speed';

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: SortKey;
  direction: SortDirection;
};

export const SORTABLE_COLUMNS: { key: SortKey; title: string }[] = [
  { key: 'name', title: 'Транспорт' },
  { key: 'temperature', title: 'Температура' },
  { key: 'speed', title: 'Скорость' },
];

/*
 * У чисел первый клик даёт убывание — проблемные
 * значения должны сразу оказаться сверху.
 */
const DEFAULT_DIRECTION: Record<SortKey, SortDirection> = {
  name: 'asc',
  temperature: 'desc',
  speed: 'desc',
};

export const DEFAULT_SORT: SortState = {
  key: 'temperature',
  direction: DEFAULT_DIRECTION.temperature,
};

export function getNextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return {
      key,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    };
  }

  return {
    key,
    direction: DEFAULT_DIRECTION[key],
  };
}

function compare(first: Transport, second: Transport, key: SortKey): number {
  if (key === 'name') {
    /*
     * numeric — иначе «Транспорт 100»
     * встанет перед «Транспорт 2».
     */
    return first.name.localeCompare(second.name, 'ru', { numeric: true });
  }

  return first[key] - second[key];
}

export function sortTransports(transports: Transport[], sort: SortState): Transport[] {
  const sign = sort.direction === 'asc' ? 1 : -1;

  return [...transports].sort((first, second) => compare(first, second, sort.key) * sign);
}

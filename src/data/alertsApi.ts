import { ALERTS_PAGE_SIZE, ALERTS_SORT, DAY_MS } from '../constants';

import type { Alert, AlertType } from '../types/alert';

/** Курсор search_after бэкенда, например [1728979000000, "a2"]. Клиент его не разбирает, только возвращает. */
export type AlertsSortValue = (number | string)[];

function apiUrl(path: string): string {
  return `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/${path}`;
}

/**
 * Тело POST /api/v1/alert. Все поля nullable. Даты — uuuu-MM-dd'T'HH:mm:ss.SSSXXX,
 * этому формату соответствует Date.toISOString() ("2026-10-15T00:00:00.000Z").
 */
type FilterAlertRequestDto = {
  startDate: string | null;
  endDate: string | null;
  sortValue: AlertsSortValue | null;
};

/** Элемент ответа. Числа на бэкенде — Double, то есть могут прийти null. */
type FilterAlertResponseDto = {
  type: AlertType;
  timestamp: string;
  carriageNumber: string;
  carriageType: string;
  batteryNumber: string;
  temperature: number | null;
  voltage: number | null;
  imbalance: number | null;
  /** Курсор search_after этой записи. */
  sortValue: AlertsSortValue;
};

/** Page<FilterAlertResponseDto> из Spring — остальные поля Page клиенту не нужны. */
type FilterAlertPageDto = {
  content: FilterAlertResponseDto[];
};

function fromDto(dto: FilterAlertResponseDto): Alert {
  return {
    type: dto.type,
    timestamp: dto.timestamp,
    carriage_number: dto.carriageNumber,
    carriage_type: dto.carriageType,
    battery_number: dto.batteryNumber,
    temperature: dto.temperature ?? NaN,
    voltage: dto.voltage ?? NaN,
    imbalance: dto.imbalance ?? NaN,
  };
}

export type AlertsPage = {
  alerts: Alert[];
  /** sortValue последней записи — курсор следующей страницы; null — записей нет. */
  sortValue: AlertsSortValue | null;
};

/**
 * Страница алертов с timestamp в [startDate, endDate] (ISO). sortValue — курсор из прошлого ответа,
 * null для первой страницы. Фильтры между страницами должны совпадать, меняется только курсор.
 */
export async function fetchAlertsPage(
  startDate: string,
  endDate: string,
  sortValue: AlertsSortValue | null,
  signal?: AbortSignal,
): Promise<AlertsPage> {
  const body: FilterAlertRequestDto = { startDate, endDate, sortValue };

  const query = new URLSearchParams({ sort: ALERTS_SORT, size: String(ALERTS_PAGE_SIZE) });

  const response = await fetch(apiUrl(`alert?${query}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить алерты: ${response.status}`);
  }

  const { content } = (await response.json()) as FilterAlertPageDto;

  const last = content.at(-1);

  return {
    alerts: content.map(fromDto),
    sortValue: last && last.sortValue.length > 0 ? last.sortValue : null,
  };
}

/** Начало UTC-суток, содержащих instantMs (не локальных, как getLocalDayRange). */
export function getUtcDayStart(instantMs: number): number {
  return Math.floor(instantMs / DAY_MS) * DAY_MS;
}

/*
 * startDate всех запросов за сутки: 00:00:00.000 текущего дня в UTC — так задано бэкендом.
 * Для МСК это 03:00 местного времени, то есть окно не совпадает с локальным днём,
 * по которому UI считает "сегодня" (getLocalDayRange): алерты 00:00–03:00 МСК сюда не попадут,
 * а до 03:00 МСК придут алерты вчерашнего местного дня.
 */
export function alertsStartDate(instantMs: number): string {
  return new Date(getUtcDayStart(instantMs)).toISOString();
}

/** endDate за те же сутки: 23:59:59.999 UTC — последняя миллисекунда, годится и для <, и для <= на бэкенде. */
export function alertsEndDate(instantMs: number): string {
  return new Date(getUtcDayStart(instantMs) + DAY_MS - 1).toISOString();
}

function alertKey(alert: Alert): string {
  return `${alert.type}|${alert.timestamp}|${alert.carriage_number}|${alert.battery_number}`;
}

/** prev + incoming без дублей: страховка на случай, если бэкенд повторит запись на границе курсора. */
export function mergeAlerts(prev: Alert[], incoming: Alert[]): Alert[] {
  const seen = new Set(prev.map(alertKey));

  const fresh = incoming.filter((alert) => {
    const key = alertKey(alert);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });

  return fresh.length > 0 ? [...prev, ...fresh] : prev;
}

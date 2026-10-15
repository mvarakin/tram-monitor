import { ALERTS_PAGE_SIZE, DAY_MS } from '../constants';

import type { Alert } from '../types/alert';

/** Курсор search_after бэкенда, например [1728979000000, "a2"]. Клиент его не разбирает, только возвращает. */
export type AlertsSortValue = (number | string)[];

function apiUrl(path: string): string {
  return `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/${path}`;
}

/** Тело POST /api/v1/alert. */
type FilterAlertRequestDto = {
  start_date: string;
  sortValue: AlertsSortValue | null;
};

/** Алерты в content — формат src/data/edc_alert_desc.ts. */
type AlertsPageDto = {
  content: Alert[];
  sortValue?: AlertsSortValue | null;
};

export type AlertsPage = {
  alerts: Alert[];
  /** Курсор для следующей страницы; null — бэкенд его не вернул. */
  sortValue: AlertsSortValue | null;
};

/**
 * Страница алертов с timestamp от startDate (ISO). sortValue — курсор из прошлого ответа,
 * null для первой страницы. Фильтры между страницами должны совпадать, меняется только курсор.
 */
export async function fetchAlertsPage(
  startDate: string,
  sortValue: AlertsSortValue | null,
  signal?: AbortSignal,
): Promise<AlertsPage> {
  const body: FilterAlertRequestDto = { start_date: startDate, sortValue };

  const response = await fetch(apiUrl(`alert?size=${ALERTS_PAGE_SIZE}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить алерты: ${response.status}`);
  }

  const page = (await response.json()) as AlertsPageDto;

  return { alerts: page.content, sortValue: page.sortValue ?? null };
}

/** Начало UTC-суток, содержащих instantMs (не локальных, как getLocalDayRange). */
export function getUtcDayStart(instantMs: number): number {
  return Math.floor(instantMs / DAY_MS) * DAY_MS;
}

/*
 * start_date всех запросов за сутки: 00:00:00.000 текущего дня в UTC — так задано бэкендом.
 * Для МСК это 03:00 местного времени, то есть окно не совпадает с локальным днём,
 * по которому UI считает "сегодня" (getLocalDayRange): алерты 00:00–03:00 МСК сюда не попадут,
 * а до 03:00 МСК придут алерты вчерашнего местного дня.
 */
export function alertsStartDate(instantMs: number): string {
  return new Date(getUtcDayStart(instantMs)).toISOString();
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

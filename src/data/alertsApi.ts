import { DAY_MS } from '../constants';

import type { Alert } from '../types/alert';

/** Алерт в ответе бэкенда — формат src/data/edc_alert_desc.ts, поля imbalance там нет. */
type AlertDto = Omit<Alert, 'imbalance'> & { imbalance?: number; };

function apiUrl(path: string): string {
  return `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/${path}`;
}

function fromDto(dto: AlertDto): Alert {
  return { ...dto, imbalance: dto.imbalance ?? NaN };
}

/** Алерты начиная с start (ISO). Включительно ли start — не важно: дубли снимает mergeAlerts(). */
export async function fetchAlerts(start: string, signal?: AbortSignal): Promise<Alert[]> {
  const response = await fetch(apiUrl(`alert?start=${encodeURIComponent(start)}`), { signal });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить алерты: ${response.status}`);
  }

  return ((await response.json()) as AlertDto[]).map(fromDto);
}

/** Начало UTC-суток, содержащих instantMs (не локальных, как getLocalDayRange). */
export function getUtcDayStart(instantMs: number): number {
  return Math.floor(instantMs / DAY_MS) * DAY_MS;
}

/*
 * start первого запроса, пока алертов ещё не было: 00:00:00.000 текущего дня в UTC — так задано
 * бэкендом. Для МСК это 03:00 местного времени, то есть окно не совпадает с локальным днём,
 * по которому UI считает "сегодня" (getLocalDayRange): алерты 00:00–03:00 МСК сюда не попадут,
 * а до 03:00 МСК придут алерты вчерашнего местного дня.
 */
export function initialAlertsStart(instantMs: number): string {
  return new Date(getUtcDayStart(instantMs)).toISOString();
}

function alertKey(alert: Alert): string {
  return `${alert.type}|${alert.timestamp}|${alert.carriage_number}|${alert.battery_number}`;
}

/** prev + incoming без дублей: последний алерт прошлого ответа может прийти снова, если бэкенд отдаёт timestamp >= start. */
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

/** Самый поздний timestamp — исходной строкой из ответа, чтобы не терять точность при пересборке. Порядок в массиве не гарантирован. */
export function latestTimestamp(alerts: Alert[]): string | undefined {
  let latest: string | undefined;
  let latestMs = -Infinity;

  for (const alert of alerts) {
    const ms = Date.parse(alert.timestamp);

    if (ms > latestMs) {
      latestMs = ms;
      latest = alert.timestamp;
    }
  }

  return latest;
}

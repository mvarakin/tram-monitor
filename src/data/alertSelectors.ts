import type { Alert, AlertType } from '../types/alert';
import type { BatteryCriticalEvents } from './carriageSelectors';
import type { Metric } from '../types/metric';

const ALERT_TYPE_BY_METRIC: Record<Metric, AlertType> = {
  temperature: 'TEMPERATURE',
  voltage: 'VOLTAGE',
};

export type AlertRow = {
  number: string;
  type: string;
  lastTimestamp: string;
  lastValue: number;
  count: number;
};

type Group = {
  carriageType: string;
  lastTimestampMs: number;
  lastAlert: Alert;
  count: number;
};

function valueOf(alert: Alert, metric: Metric): number {
  return metric === 'temperature' ? alert.temperature : alert.voltage;
}

/** Строки таблицы алертов: по строке на вагон, у которого сегодня был хотя бы один алерт этого типа. */
export function getAlertRows(alerts: Alert[], metric: Metric): AlertRow[] {
  const alertType = ALERT_TYPE_BY_METRIC[metric];

  const groups = new Map<string, Group>();

  for (const alert of alerts) {
    if (alert.type !== alertType) {
      continue;
    }

    const timestampMs = new Date(alert.timestamp).getTime();

    const existing = groups.get(alert.carriage_number);

    if (!existing) {
      groups.set(alert.carriage_number, {
        carriageType: alert.carriage_type,
        lastTimestampMs: timestampMs,
        lastAlert: alert,
        count: 1,
      });

      continue;
    }

    existing.count += 1;

    if (timestampMs > existing.lastTimestampMs) {
      existing.lastTimestampMs = timestampMs;
      existing.lastAlert = alert;
    }
  }

  const rows: AlertRow[] = [];

  for (const [number, group] of groups) {
    rows.push({
      number,
      type: group.carriageType,
      lastTimestamp: group.lastAlert.timestamp,
      lastValue: valueOf(group.lastAlert, metric),
      count: group.count,
    });
  }

  return rows.sort((a, b) => b.lastTimestamp.localeCompare(a.lastTimestamp) || a.number.localeCompare(b.number));
}

export type CarriageAlertData = {
  carriageType: string;
  eventsByBattery: BatteryCriticalEvents;
};

/**
 * Данные для страницы алертов вагона. `null` — по этому номеру нет вообще
 * ни одного алерта (битый URL/чужой номер). Пустой `eventsByBattery` при
 * непустом результате — номер существует, но алертов этой метрики нет.
 */
export function getCarriageAlertData(alerts: Alert[], carriageNumber: string, metric: Metric): CarriageAlertData | null {
  const alertType = ALERT_TYPE_BY_METRIC[metric];

  let carriageType: string | null = null;
  const eventsByBattery: BatteryCriticalEvents = {};

  for (const alert of alerts) {
    if (alert.carriage_number !== carriageNumber) {
      continue;
    }

    carriageType = alert.carriage_type;

    if (alert.type !== alertType) {
      continue;
    }

    (eventsByBattery[alert.battery_number] ??= []).push({
      timestamp: new Date(alert.timestamp).getTime(),
      value: valueOf(alert, metric),
    });
  }

  return carriageType === null ? null : { carriageType, eventsByBattery };
}

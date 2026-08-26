import type { Carriage, CriticalType, EdcStatistic } from '../types/edcStatistic';
import type { Metric } from '../types/metric';

const CRITICAL_TYPE_BY_METRIC: Record<Metric, CriticalType> = {
  temperature: 'TEMPERATURE',
  voltage: 'VOLTAGE',
};

function getBatteryValue(battery: { avg_temp: number | null; avg_vol: number | null }, metric: Metric): number | null {
  return metric === 'temperature' ? battery.avg_temp : battery.avg_vol;
}

export type CarriageRow = {
  number: string;
  type: string;
  max: number;
  criticalCount: number;
};

/*
 * Максимум считается по avg и по значениям critical-событий подходящего типа —
 * ровно то, что попадает на график линиями и ромбами. Иначе верх таблицы
 * разошёлся бы с пиком на графике.
 */
function buildCarriageRow(carriage: Carriage, metric: Metric): CarriageRow | null {
  const criticalType = CRITICAL_TYPE_BY_METRIC[metric];

  let max: number | null = null;

  let criticalCount = 0;

  for (const minute of carriage.data) {
    for (const battery of minute.batteries) {
      const value = getBatteryValue(battery, metric);

      if (value !== null && (max === null || value > max)) {
        max = value;
      }

      for (const event of battery.critical) {
        if (event.type !== criticalType) {
          continue;
        }

        criticalCount += 1;

        if (max === null || event.value > max) {
          max = event.value;
        }
      }
    }
  }

  // Вагон без единого значения по этой метрике в таблицу не попадает.
  return max === null ? null : { number: carriage.number, type: carriage.type, max, criticalCount };
}

/** Строки таблицы метрики: по строке на вагон, у которого есть хоть одно значение за период. */
export function getCarriageRows(edc: EdcStatistic, metric: Metric): CarriageRow[] {
  const rows: CarriageRow[] = [];

  for (const carriage of edc.carriages) {
    const row = buildCarriageRow(carriage, metric);

    if (row) {
      rows.push(row);
    }
  }

  return rows.sort((a, b) => b.max - a.max || a.number.localeCompare(b.number));
}

/** Среднее значение метрики за минуту. */
export type Point = {
  timestamp: number;
  end: number;
  value: number;
};

/** Точки батареи, разрезанные на непрерывные куски: между сегментами данных не было. */
export type BatterySegments = Record<string, Point[][]>;

/*
 * Минута считается пропущенной, если следующая точка начинается позже, чем закончилась
 * предыдущая. Один критерий покрывает все причины пропуска: avg === null, минуты нет
 * в carriage.data, батареи нет в minute.batteries.
 */
function appendPoint(segments: Point[][], point: Point): void {
  const lastSegment = segments[segments.length - 1];

  const lastPoint = lastSegment?.[lastSegment.length - 1];

  if (!lastPoint || point.timestamp > lastPoint.end) {
    segments.push([point]);

    return;
  }

  lastSegment.push(point);
}

/** Линии по батареям вагона: минута → avg метрики. */
export function buildBatterySegments(carriage: Carriage, metric: Metric): BatterySegments {
  const segmentsByBattery: BatterySegments = {};

  for (const minute of carriage.data) {
    const timestamp = new Date(minute.from).getTime();

    const end = new Date(minute.to).getTime();

    for (const battery of minute.batteries) {
      const value = getBatteryValue(battery, metric);

      if (value === null) {
        continue;
      }

      appendPoint((segmentsByBattery[battery.number] ??= []), { timestamp, end, value });
    }
  }

  return segmentsByBattery;
}

/** Критическое событие: собственный момент времени внутри минуты и значение-нарушитель. */
export type CriticalPoint = {
  timestamp: number;
  value: number;
};

export type BatteryCriticalEvents = Record<string, CriticalPoint[]>;

/*
 * Критические события по батареям вагона. Отсутствие avg в этой минуте событие не отменяет:
 * дыра в телеметрии рвёт линию, но ромб на графике остаётся.
 */
export function buildCriticalEvents(carriage: Carriage, metric: Metric): BatteryCriticalEvents {
  const criticalType = CRITICAL_TYPE_BY_METRIC[metric];

  const eventsByBattery: BatteryCriticalEvents = {};

  for (const minute of carriage.data) {
    for (const battery of minute.batteries) {
      for (const event of battery.critical) {
        if (event.type !== criticalType) {
          continue;
        }

        (eventsByBattery[battery.number] ??= []).push({
          timestamp: new Date(event.timestamp).getTime(),
          value: event.value,
        });
      }
    }
  }

  return eventsByBattery;
}

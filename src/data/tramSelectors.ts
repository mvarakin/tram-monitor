import type { Carriage, CriticalType, EdcStatistic, MinuteData } from '../types/edcStatistic';
import type { Metric } from '../types/metric';

export const TRAM_NAME = 'Трамвай 1';

const CRITICAL_TYPE_BY_METRIC: Record<Metric, CriticalType> = {
  temperature: 'TEMPERATURE',
  voltage: 'VOLTAGE',
};

function getBatteryValue(battery: { avg_temp: number | null; avg_vol: number | null }, metric: Metric): number | null {
  return metric === 'temperature' ? battery.avg_temp : battery.avg_vol;
}

function getLastMinute(carriage: Carriage): MinuteData | undefined {
  return carriage.data[carriage.data.length - 1];
}

/** Максимум значения метрики среди всех батарей всех вагонов за последнюю минуту. */
export function getMaxValue(edc: EdcStatistic, metric: Metric): number | null {
  let max: number | null = null;

  for (const carriage of edc.carriages) {
    const minute = getLastMinute(carriage);

    if (!minute) {
      continue;
    }

    for (const battery of minute.batteries) {
      const value = getBatteryValue(battery, metric);

      if (value === null) {
        continue;
      }

      if (max === null || value > max) {
        max = value;
      }
    }
  }

  return max;
}

export type TramRow = {
  id: number;
  name: string;
  value: number | null;
};

/** Строки главной таблицы. Пока трамвай ровно один. */
export function getTramRows(edc: EdcStatistic, metric: Metric): TramRow[] {
  return [{ id: 1, name: TRAM_NAME, value: getMaxValue(edc, metric) }];
}

export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Свечи по батареям вагона: минута → OHLC. open/close = avg, high/low раздвигаются critical-событиями. */
export function buildBatteryCandles(carriage: Carriage, metric: Metric): Record<string, Candle[]> {
  const criticalType = CRITICAL_TYPE_BY_METRIC[metric];

  const candlesByBattery: Record<string, Candle[]> = {};

  for (const minute of carriage.data) {
    const timestamp = new Date(minute.from).getTime();

    for (const battery of minute.batteries) {
      const value = getBatteryValue(battery, metric);

      if (value === null) {
        continue;
      }

      const criticalValues = battery.critical
        .filter((event) => event.type === criticalType)
        .map((event) => event.value);

      const high = Math.max(value, ...criticalValues);

      const low = Math.min(value, ...criticalValues);

      const candle: Candle = { timestamp, open: value, high, low, close: value };

      (candlesByBattery[battery.number] ??= []).push(candle);
    }
  }

  return candlesByBattery;
}

import type { Metric } from '../types/metric';
import { METRIC_UNIT } from '../constants';

/*
 * Температура показывается целыми градусами: доли градуса в телеметрии — шум,
 * который только мешает сравнивать значения. Напряжение остаётся с десятыми.
 */
export function formatMetricValue(value: number, metric: Metric): string {
  return metric === 'temperature' ? String(Math.round(value)) : value.toFixed(1);
}

/** Значение с единицей измерения — для подписей осей, панели и подсказок. */
export function formatMetricWithUnit(value: number, metric: Metric): string {
  return `${formatMetricValue(value, metric)}${METRIC_UNIT[metric]}`;
}

import type { Metric } from '../types/metric';
import { METRIC_UNIT } from '../constants';

/*
 * Температура показывается целыми градусами: доли градуса в телеметрии — шум,
 * который только мешает сравнивать значения. Напряжение остаётся с десятыми.
 */
export function roundMetricValue(value: number, metric: Metric): number {
  return metric === 'temperature' ? Math.round(value) : Math.round(value * 10) / 10;
}

export function formatMetricValue(value: number, metric: Metric): string {
  const rounded = roundMetricValue(value, metric);
  return metric === 'temperature' ? String(rounded) : rounded.toFixed(1);
}

/** Значение с единицей измерения — для подписей осей, панели и подсказок. */
export function formatMetricWithUnit(value: number, metric: Metric): string {
  return `${formatMetricValue(value, metric)}${METRIC_UNIT[metric]}`;
}

/** Диапазон min–max с дробной частью для всех событий минуты (без округления в целые). */
export function formatMetricRangeWithUnit(min: number, max: number, metric: Metric): string {
  if (min === max) {
    return `${min.toFixed(1)}${METRIC_UNIT[metric]}`;
  }
  return `${min.toFixed(1)}–${max.toFixed(1)}${METRIC_UNIT[metric]}`;
}

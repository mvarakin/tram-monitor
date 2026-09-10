import type { Metric } from '../types/metric';
import { METRIC_DECIMALS, METRIC_UNIT } from '../constants';

/** Точность у каждой метрики своя — почему именно такая, см. METRIC_DECIMALS в constants.ts. */
export function roundMetricValue(value: number, metric: Metric): number {
  const factor = 10 ** METRIC_DECIMALS[metric];
  return Math.round(value * factor) / factor;
}

export function formatMetricValue(value: number, metric: Metric): string {
  return roundMetricValue(value, metric).toFixed(METRIC_DECIMALS[metric]);
}

/** Значение с единицей измерения — для подписей осей, панели и подсказок. */
export function formatMetricWithUnit(value: number, metric: Metric): string {
  return `${formatMetricValue(value, metric)}${METRIC_UNIT[metric]}`;
}

/** Диапазон min–max с дробной частью для всех событий минуты (без округления в целые). */
export function formatMetricRangeWithUnit(min: number, max: number, metric: Metric): string {
  /* Температура здесь намеренно не округляется в целые (в отличие от formatMetricValue):
   * диапазон одной минуты узкий, и целые градусы схлопнули бы его в одно число. */
  const decimals = Math.max(METRIC_DECIMALS[metric], 1);

  if (min === max) {
    return `${min.toFixed(decimals)}${METRIC_UNIT[metric]}`;
  }
  return `${min.toFixed(decimals)}–${max.toFixed(decimals)}${METRIC_UNIT[metric]}`;
}

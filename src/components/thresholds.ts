import type { Metric } from '../types/metric';
import { METRIC_DANGER, type Tone } from '../constants';

export function getDanger(metric: Metric): number {
  return METRIC_DANGER[metric];
}

export function getTone(value: number, metric: Metric): Tone {
  return value > getDanger(metric) ? 'danger' : 'normal';
}

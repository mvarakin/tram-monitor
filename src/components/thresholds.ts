import type { Metric } from '../types/metric';
import { TEMPERATURE_DANGER, VOLTAGE_DANGER, type Tone } from '../constants';

export function getDanger(metric: Metric): number {
  return metric === 'temperature' ? TEMPERATURE_DANGER : VOLTAGE_DANGER;
}

export function getTone(value: number, metric: Metric): Tone {
  return value > getDanger(metric) ? 'danger' : 'normal';
}

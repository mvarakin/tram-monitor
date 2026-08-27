import type { Metric } from '../types/metric';
import { TEMPERATURE_DANGER, VOLTAGE_DANGER, type Tone } from '../constants';

export function getTone(value: number, metric: Metric): Tone {
  const danger = metric === 'temperature' ? TEMPERATURE_DANGER : VOLTAGE_DANGER;

  return value > danger ? 'danger' : 'normal';
}

import type { Metric } from '../types/metric';

export type Tone = 'normal' | 'danger';

export const TEMPERATURE_DANGER = 45;

export const VOLTAGE_DANGER = 450;

export const TONE_COLOR: Record<Tone, string> = {
  normal: 'green',
  danger: 'red',
};

export function getTone(value: number, metric: Metric): Tone {
  const danger = metric === 'temperature' ? TEMPERATURE_DANGER : VOLTAGE_DANGER;

  return value > danger ? 'danger' : 'normal';
}

import type { Metric } from './types/metric';

export type Tone = 'normal' | 'danger';

export const TEMPERATURE_DANGER = 45;

export const VOLTAGE_DANGER = 450;

export const TONE_COLOR: Record<Tone, string> = {
  normal: 'green',
  danger: 'red',
};

export const METRIC_UNIT: Record<Metric, string> = {
  temperature: '°C',
  voltage: 'В',
};

export const METRIC_LABEL: Record<Metric, string> = {
  temperature: 'Температура',
  voltage: 'Напряжение',
};

export const METRIC_TICK_MIN_STEP: Record<Metric, number> = {
  temperature: 1,
  voltage: 0.1,
};

export const PERIOD_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

export const MINUTE_MS = 60_000;

export const HOUR_MS = 3_600_000;

export const HALF_HOUR_MS = 1_800_000;

export const DAY_MS = 86_400_000;

export const CHART_MARGIN = {
  top: 20,
  right: 90,
  bottom: 60,
  left: 60,
};

export const BATTERY_COLORS = ['#2a78d6', '#1baf7a', '#9c34eb', '#eda100', '#e87ba4', '#4a3aa7'];

export const SINGLE_POINT_RADIUS = 1.5;

export const MARK_RADIUS = 6;

export const HIT_RADIUS = 9;

export const CROSSHAIR_DASHARRAY = '3 3';

export const CROSSHAIR_OPACITY = 0.9;

export const TOOLTIP_RING_RADIUS = 30;

export const TOOLTIP_RING_STROKE_WIDTH = 10;

export const TOOLTIP_RING_GAP_DEG = 2;

export const TOOLTIP_ANCHOR_GAP = 14;

export const TOOLTIP_EDGE_PADDING = 8;

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

export const PERIOD_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

export const HOUR_MS = 3_600_000;

export const HALF_HOUR_MS = 1_800_000;

export const DAY_MS = 86_400_000;

export const PANEL_WIDTH = 150;

/** Зазор между площадкой графика и панелью: в нём живут диагонали соединителей. */
export const PANEL_GAP = 60;

export const TITLE_HEIGHT = 28;

export const GROUP_HEADER_HEIGHT = 26;

export const ROW_HEIGHT = 22;

export const GROUP_GAP = 12;

export const CHART_WIDTH = 1600;

export const CHART_HEIGHT = 500;

export const CHART_MARGIN = {
  top: 20,
  right: 90,
  bottom: 60,
  left: 60,
};

export const BATTERY_COLORS = ['#2a78d6', '#1baf7a', '#eb6834', '#eda100', '#e87ba4', '#4a3aa7'];

export const SINGLE_POINT_RADIUS = 1.5;

export const DIVIDER_OFFSET = 30;

export const ANCHOR_OFFSET = 16;

export const ANCHOR_RADIUS = 2.5;

export const MARK_STUB = 6;

export const LEAD_STUB = 18;

export const ANCHOR_STUB = 14;

export const LINK_OPACITY = 0.45;

export const BACKGROUND_OPACITY = 0.12;

export const FONT_SIZE = 12;

export const TEXT_BASELINE = 4;

export const MARK_RADIUS = 4;

export const HIT_RADIUS = 9;

export const CROSSHAIR_DASHARRAY = '3 3';

export const CROSSHAIR_OPACITY = 0.9;

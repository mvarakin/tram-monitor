import type { ChartLegendItem } from './ChartLegend';

export const SPEED_LEGEND: ChartLegendItem[] = [
  { label: 'менее 60 км/ч', tone: 'normal' },
  { label: '60–80 км/ч', tone: 'warning' },
  { label: '80–120 км/ч', tone: 'danger' },
];

export const TEMPERATURE_LEGEND: ChartLegendItem[] = [
  { label: 'менее 80 °C', tone: 'normal' },
  { label: 'более 80 °C', tone: 'danger' },
];

import { formatMetricWithUnit } from './metricFormat';

import type { Metric } from '../types/metric';

type ChartTooltipProps = {
  left: number;
  top: number;
  battery: string;
  /** Цвет линии батареи — имя в подсказке совпадает с графиком и легендой. */
  color: string;
  timestamp: number;
  value: number;
  metric: Metric;
};

function formatMoment(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Подсказка критического события. Координаты — в пикселях контейнера графика. */
export function ChartTooltip({ left, top, battery, color, timestamp, value, metric }: ChartTooltipProps) {
  return (
    <div className='chart-tooltip' style={{ left, top }}>
      <div className='chart-tooltip__battery' style={{ color }}>
        {battery}
      </div>

      <div>{formatMoment(timestamp)}</div>

      <div className='chart-tooltip__value'>{formatMetricWithUnit(value, metric)}</div>
    </div>
  );
}

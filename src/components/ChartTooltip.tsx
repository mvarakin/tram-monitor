import { formatMetricWithUnit } from './metricFormat';

import type { Ref } from 'react';
import type { CriticalPoint } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';
import { MinuteAlertRing } from './MinuteAlertRing';

type ChartTooltipProps = {
  ref?: Ref<HTMLDivElement>;
  left: number;
  top: number;
  battery: string;
  /** Цвет линии батареи — имя в подсказке совпадает с графиком и легендой. */
  color: string;
  timestamp: number;
  value: number;
  metric: Metric;
  /** Все события этой батареи (текущей метрики) — источник для минутного кольца алертов. */
  events: CriticalPoint[];
};

function formatMoment(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Подсказка критического события. Координаты — в пикселях контейнера графика. */
export function ChartTooltip({ ref, left, top, battery, color, timestamp, value, metric, events }: ChartTooltipProps) {
  return (
    <div className='chart-tooltip' ref={ref} style={{ left, top }}>
      <div className='chart-tooltip__battery' style={{ color }}>
        {battery}
      </div>

      <div>{formatMoment(timestamp)}</div>

      <div className='chart-tooltip__value'>{formatMetricWithUnit(value, metric)}</div>

      <MinuteAlertRing events={events} timestamp={timestamp} color={color} />
    </div>
  );
}

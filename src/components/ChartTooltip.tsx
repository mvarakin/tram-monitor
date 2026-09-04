import { formatMetricRangeWithUnit } from './metricFormat';

import type { CSSProperties, Ref } from 'react';
import type { CriticalPoint } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';
import { MinuteAlertRing } from './MinuteAlertRing';
import { MinuteAlertBars } from './MinuteAlertBars';
import { MinuteAlertViewSwitch } from './MinuteAlertViewSwitch';
import { useMinuteAlertView } from './useMinuteAlertView';

type ChartTooltipProps = {
  ref?: Ref<HTMLDivElement>;
  left: number;
  top: number;
  /** С какой стороны бара стоит карточка — стрелка рисуется на противоположном крае, к бару. */
  side: 'left' | 'right';
  /** Смещение стрелки от верха карточки до Y бара, px. */
  arrowTop: number;
  battery: string;
  /** Цвет линии батареи — имя в подсказке совпадает с графиком и легендой. */
  color: string;
  timestamp: number;
  min: number;
  max: number;
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
export function ChartTooltip({
  ref,
  left,
  top,
  side,
  arrowTop,
  battery,
  color,
  timestamp,
  min,
  max,
  metric,
  events,
}: ChartTooltipProps) {
  const style = { left, top, '--arrow-top': `${arrowTop}px` } as CSSProperties;

  const [view, setView] = useMinuteAlertView();

  return (
    <div className={`chart-tooltip chart-tooltip--arrow-${side}`} ref={ref} style={style}>
      <div className='chart-tooltip__header'>
        <div className='chart-tooltip__battery' style={{ color }}>
          {battery}
        </div>

        <MinuteAlertViewSwitch view={view} onViewChange={setView} />
      </div>

      <div>{formatMoment(timestamp)}</div>

      <div className='chart-tooltip__value'>{formatMetricRangeWithUnit(min, max, metric)}</div>

      {view === 'ring' ? (
        <MinuteAlertRing events={events} timestamp={timestamp} color={color} metric={metric} />
      ) : (
        <MinuteAlertBars events={events} timestamp={timestamp} color={color} metric={metric} />
      )}
    </div>
  );
}

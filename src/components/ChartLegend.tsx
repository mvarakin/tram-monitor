import { CHART_MARGIN, CHART_WIDTH } from './chartLayout';

import type { Tone } from './thresholds';

export type ChartLegendItem = {
  label: string;
  tone: Tone;
};

type ChartLegendProps = {
  items: ChartLegendItem[];
};

/*
 * Выравниваем легенду по левому краю области построения.
 *
 * Проценты — потому что svg тянется по ширине контейнера,
 * и левый отступ графика масштабируется вместе с ним.
 * min() держит выравнивание, когда svg упёрся в CHART_WIDTH.
 */
const PLOT_OFFSET = `min(${CHART_MARGIN.left}px, ${(CHART_MARGIN.left / CHART_WIDTH) * 100}%)`;

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className='chart-legend' style={{ paddingLeft: PLOT_OFFSET }}>
      {items.map((item) => (
        <span key={item.label} className={`chart-legend__item chart-legend__item--${item.tone}`}>
          ● {item.label}
        </span>
      ))}
    </div>
  );
}

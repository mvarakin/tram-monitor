import { CHART_MARGIN, CHART_WIDTH } from '../constants';

type BatteryLegendProps = {
  items: { label: string; color: string }[];
};

const PLOT_OFFSET = `min(${CHART_MARGIN.left}px, ${(CHART_MARGIN.left / CHART_WIDTH) * 100}%)`;

export function BatteryLegend({ items }: BatteryLegendProps) {
  return (
    <div className='chart-legend' style={{ paddingLeft: PLOT_OFFSET }}>
      {items.map((item) => (
        <span key={item.label} className='chart-legend__item' style={{ color: item.color }}>
          ● {item.label}
        </span>
      ))}
    </div>
  );
}

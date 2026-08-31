import { CHART_MARGIN } from '../constants';

type BatteryLegendProps = {
  items: { label: string; color: string }[];
};

const PLOT_OFFSET = `${CHART_MARGIN.left}px`;

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

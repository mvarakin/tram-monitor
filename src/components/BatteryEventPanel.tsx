import { isSameEvent } from './hoveredEvent';
import { formatMetricWithUnit } from './metricFormat';

import type { CriticalPoint } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';

type BatteryEventPanelProps = {
  battery: string;
  color: string;
  events: CriticalPoint[];
  metric: Metric;
  hovered: { battery: string; event: CriticalPoint } | null;
  onHover: (event: CriticalPoint, battery: string) => void;
  onLeave: () => void;
};

function formatMoment(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function BatteryEventPanel({
  battery,
  color,
  events,
  metric,
  hovered,
  onHover,
  onLeave,
}: BatteryEventPanelProps) {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className='battery-events__block'>
      <div className='battery-events__scroll'>
        <div className='battery-events__header' style={{ color }}>
          ● {battery} · {events.length}
        </div>

        {sortedEvents.length === 0 ? (
          <div className='battery-events__empty'>нет событий</div>
        ) : (
          sortedEvents.map((event) => {
            const isHovered = isSameEvent(hovered, battery, event);

            return (
              <div
                key={`${event.timestamp}-${event.value}`}
                className='battery-events__row'
                style={isHovered ? { backgroundColor: `${color}1f` } : undefined}
                onMouseEnter={() => onHover(event, battery)}
                onMouseLeave={onLeave}>
                <div className='battery-events__time'>{formatMoment(event.timestamp)}</div>

                <div className='battery-events__value'>{formatMetricWithUnit(event.value, metric)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

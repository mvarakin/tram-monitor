import { minuteBucket } from './minuteGroups';
import { formatMetricWithUnit } from './metricFormat';

import type { CriticalPoint } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';
import type { SelectedEvent } from './useEventSelection';

type BatteryEventPanelProps = {
  battery: string;
  color: string;
  events: CriticalPoint[];
  metric: Metric;
  hovered: { battery: string; event: CriticalPoint } | null;
  selected: SelectedEvent | null;
  /** Все события выбранной батареи из той же минуты, что и кликнутое (см. minuteGroups.ts) — подсвечиваются вместе. */
  selectedGroup: CriticalPoint[];
  onHover: (event: CriticalPoint, battery: string) => void;
  onLeave: () => void;
  onSelect: (event: CriticalPoint, battery: string) => void;
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
  selected,
  selectedGroup,
  onHover,
  onLeave,
  onSelect,
}: BatteryEventPanelProps) {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  const hoveredBucket = hovered?.battery === battery ? minuteBucket(hovered.event.timestamp) : null;

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
            const isActive =
              (hoveredBucket !== null && minuteBucket(event.timestamp) === hoveredBucket) ||
              (selected?.battery === battery &&
                selectedGroup.some((groupEvent) => groupEvent.timestamp === event.timestamp && groupEvent.value === event.value));

            return (
              <div
                key={`${event.timestamp}-${event.value}`}
                className='battery-events__row'
                style={isActive ? { backgroundColor: `${color}1f` } : undefined}
                onMouseEnter={() => onHover(event, battery)}
                onMouseLeave={onLeave}
                onClick={(pointer) => {
                  pointer.stopPropagation();
                  onSelect(event, battery);
                }}>
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

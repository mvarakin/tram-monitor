import { MARK_ACTIVE_WIDTH_SCALE, MARK_HIT_PADDING, MARK_MIN_HEIGHT, MARK_MIN_WIDTH, MINUTE_MS } from '../constants';
import { groupEventsByMinute, minuteBucket, pickGroupRepresentative } from './minuteGroups';

import type { MouseEvent } from 'react';

import type { CriticalPoint } from '../data/carriageSelectors';
import type { SelectedEvent } from './useEventSelection';

type CriticalEventMarksProps = {
  battery: string;
  color: string;
  events: CriticalPoint[];
  x: (event: CriticalPoint) => number;
  y: (event: CriticalPoint) => number;
  onHover: (event: CriticalPoint, battery: string) => void;
  onLeave: () => void;
  onClick: (event: CriticalPoint, battery: string) => void;
  hovered: { battery: string; event: CriticalPoint } | null;
  selected: SelectedEvent | null;
  /** Все события выбранной батареи из той же минуты, что и кликнутое (см. minuteGroups.ts) — подсвечиваются вместе. */
  selectedGroup: CriticalPoint[];
};

/** Ужимает [start, end] до минимальной длины min, растягивая симметрично от середины. */
export function clampSpan(start: number, end: number, min: number): [number, number] {
  const length = end - start;

  if (length >= min) {
    return [start, end];
  }

  const center = (start + end) / 2;

  return [center - min / 2, center + min / 2];
}

/** Критические события одной батареи: вертикальный бар от min до max value внутри календарной минуты. */
export function CriticalEventMarks({
  battery,
  color,
  events,
  x,
  y,
  onHover,
  onLeave,
  onClick,
  hovered,
  selected,
  selectedGroup,
}: CriticalEventMarksProps) {
  const groups = groupEventsByMinute(events);

  return (
    <g>
      {groups.map((group) => {
        const bucket = minuteBucket(group[0].timestamp);

        const representative = pickGroupRepresentative(group);

        const values = group.map((event) => event.value);

        const minValue = Math.min(...values);

        const maxValue = Math.max(...values);

        const isActive =
          (hovered?.battery === battery && minuteBucket(hovered.event.timestamp) === bucket) ||
          (selected?.battery === battery && selectedGroup.some((event) => minuteBucket(event.timestamp) === bucket));

        const [xLeft, xRight] = clampSpan(
          x({ timestamp: bucket, value: 0 }),
          x({ timestamp: bucket + MINUTE_MS, value: 0 }),
          MARK_MIN_WIDTH,
        );

        const [yTop, yBottom] = clampSpan(
          y({ timestamp: 0, value: maxValue }),
          y({ timestamp: 0, value: minValue }),
          MARK_MIN_HEIGHT,
        );

        const width = isActive ? (xRight - xLeft) * MARK_ACTIVE_WIDTH_SCALE : xRight - xLeft;

        const centerX = (xLeft + xRight) / 2;

        const barX = centerX - width / 2;

        const height = yBottom - yTop;

        return (
          <g key={bucket}>
            <rect
              x={barX}
              y={yTop}
              width={width}
              height={height}
              fill={color}
            />

            <rect
              x={barX - MARK_HIT_PADDING}
              y={yTop - MARK_HIT_PADDING}
              width={width + MARK_HIT_PADDING * 2}
              height={height + MARK_HIT_PADDING * 2}
              fill='transparent'
              onMouseMove={() => onHover(representative, battery)}
              onMouseLeave={onLeave}
              onClick={(pointer: MouseEvent) => {
                pointer.stopPropagation();
                onClick(representative, battery);
              }}
            />
          </g>
        );
      })}
    </g>
  );
}

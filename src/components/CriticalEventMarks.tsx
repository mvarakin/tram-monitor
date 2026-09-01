import { MARK_RADIUS, HIT_RADIUS } from '../constants';
import { isSameEvent } from './hoveredEvent';

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
};

/** Критические события одной батареи: треугольник с восклицательным знаком цвета батареи (без обводки) на значении события и мишень под курсор. */
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
}: CriticalEventMarksProps) {
  return (
    <g>
      {events.map((event) => {
        const cx = x(event);

        const cy = y(event);

        const isActive = isSameEvent(hovered, battery, event) || isSameEvent(selected, battery, event);

        const radius = isActive ? MARK_RADIUS * 1.5 : MARK_RADIUS;

        const size = radius * 2.4;

        const apexY = -size * 0.6;

        const baseY = size * 0.4;

        const halfWidth = size / 2;

        const markTopY = -size * 0.15;

        const markBottomY = size * 0.05;

        const dotY = size * 0.22;

        const dotRadius = Math.max(1, size * 0.06);

        const markStrokeWidth = Math.max(1, size * 0.12);

        const transform = `translate(${cx}, ${cy})`;

        return (
          <g key={`${event.timestamp}-${event.value}`}>
            <polygon
              points={`0,${apexY} ${-halfWidth},${baseY} ${halfWidth},${baseY}`}
              transform={transform}
              fill={color}
            />

            <line
              x1={0}
              y1={markTopY}
              x2={0}
              y2={markBottomY}
              transform={transform}
              stroke='white'
              strokeWidth={markStrokeWidth}
              strokeLinecap='round'
            />

            <circle cx={0} cy={dotY} r={dotRadius} transform={transform} fill='white' />

            <circle
              cx={cx}
              cy={cy}
              r={HIT_RADIUS}
              fill='transparent'
              onMouseMove={() => onHover(event, battery)}
              onMouseLeave={onLeave}
              onClick={(pointer: MouseEvent) => {
                pointer.stopPropagation();
                onClick(event, battery);
              }}
            />
          </g>
        );
      })}
    </g>
  );
}

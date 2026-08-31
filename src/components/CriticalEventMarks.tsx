import { TONE_COLOR, MARK_RADIUS, HIT_RADIUS } from '../constants';
import { isSameEvent } from './hoveredEvent';

import type { MouseEvent } from 'react';

import type { CriticalPoint } from '../data/carriageSelectors';

type CriticalEventMarksProps = {
  battery: string;
  events: CriticalPoint[];
  x: (event: CriticalPoint) => number;
  y: (event: CriticalPoint) => number;
  onHover: (event: CriticalPoint, battery: string, pointer: MouseEvent) => void;
  onLeave: () => void;
  hovered: { battery: string; event: CriticalPoint } | null;
};

/** Критические события одной батареи: ромб на значении события и мишень под курсор. */
export function CriticalEventMarks({ battery, events, x, y, onHover, onLeave, hovered }: CriticalEventMarksProps) {
  return (
    <g>
      {events.map((event) => {
        const cx = x(event);

        const cy = y(event);

        const isHovered = isSameEvent(hovered, battery, event);

        const radius = isHovered ? MARK_RADIUS * 1.5 : MARK_RADIUS;

        return (
          <g key={`${event.timestamp}-${event.value}`}>
            <rect
              x={-radius}
              y={-radius}
              width={radius * 2}
              height={radius * 2}
              transform={`translate(${cx}, ${cy}) rotate(45)`}
              fill={TONE_COLOR.danger}
            />

            <circle
              cx={cx}
              cy={cy}
              r={HIT_RADIUS}
              fill='transparent'
              onMouseMove={(pointer) => onHover(event, battery, pointer)}
              onMouseLeave={onLeave}
            />
          </g>
        );
      })}
    </g>
  );
}

import { TONE_COLOR } from './thresholds';

import type { MouseEvent } from 'react';

import type { CriticalPoint } from '../data/carriageSelectors';

type CriticalEventMarksProps = {
  battery: string;
  events: CriticalPoint[];
  x: (event: CriticalPoint) => number;
  y: (event: CriticalPoint) => number;
  onHover: (event: CriticalPoint, battery: string, pointer: MouseEvent) => void;
  onLeave: () => void;
};

/** Полудиагональ ромба: квадрат 2r × 2r, повёрнутый на 45°. */
const MARK_RADIUS = 4;

/** Прозрачная мишень под курсор: попасть в ромб 8×8 по диагонали слишком тяжело. */
const HIT_RADIUS = 9;

/** Критические события одной батареи: ромб на значении события и мишень под курсор. */
export function CriticalEventMarks({ battery, events, x, y, onHover, onLeave }: CriticalEventMarksProps) {
  return (
    <g>
      {events.map((event) => {
        const cx = x(event);

        const cy = y(event);

        return (
          <g key={`${event.timestamp}-${event.value}`}>
            <rect
              x={-MARK_RADIUS}
              y={-MARK_RADIUS}
              width={MARK_RADIUS * 2}
              height={MARK_RADIUS * 2}
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

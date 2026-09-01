import { TONE_COLOR, TOOLTIP_RING_GAP_DEG, TOOLTIP_RING_RADIUS, TOOLTIP_RING_STROKE_WIDTH } from '../constants';
import { buildMinuteAlertSeconds } from './minuteAlertSeconds';

import type { CriticalPoint } from '../data/carriageSelectors';

const SECONDS_PER_MINUTE = 60;
const DEG_PER_SECOND = 360 / SECONDS_PER_MINUTE;

type MinuteAlertRingProps = {
  events: CriticalPoint[];
  timestamp: number;
  color: string;
};

/** Точка на окружности: 0° — сверху (12 часов), угол растёт по часовой стрелке. */
function pointOnCircle(radius: number, angleDeg: number): { x: number; y: number; } {
  const angleRad = (angleDeg * Math.PI) / 180;

  return { x: radius * Math.sin(angleRad), y: -radius * Math.cos(angleRad) };
}

/** Кольцо из 60 дуг-секунд минуты события: красная секунда — был алерт, иначе цвет батареи. */
export function MinuteAlertRing({ events, timestamp, color }: MinuteAlertRingProps) {
  const alertSeconds = buildMinuteAlertSeconds(events, timestamp);

  const size = (TOOLTIP_RING_RADIUS + TOOLTIP_RING_STROKE_WIDTH) * 2;

  return (
    <svg
      className='chart-tooltip__ring'
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
      {alertSeconds.map((hasAlert, second) => {
        const start = pointOnCircle(TOOLTIP_RING_RADIUS, second * DEG_PER_SECOND + TOOLTIP_RING_GAP_DEG / 2);
        const end = pointOnCircle(TOOLTIP_RING_RADIUS, (second + 1) * DEG_PER_SECOND - TOOLTIP_RING_GAP_DEG / 2);

        return (
          <line
            key={second}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={hasAlert ? TONE_COLOR.danger : color}
            strokeOpacity={hasAlert ? 1 : 0.35}
            strokeWidth={TOOLTIP_RING_STROKE_WIDTH}
            strokeLinecap='butt'
          />
        );
      })}
    </svg>
  );
}

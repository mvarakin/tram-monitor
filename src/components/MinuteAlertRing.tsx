import { useState } from 'react';

import { MINUTE_MS, METRIC_UNIT, TONE_COLOR, TOOLTIP_RING_GAP_DEG, TOOLTIP_RING_RADIUS, TOOLTIP_RING_STROKE_WIDTH } from '../constants';
import { buildMinuteAlertSeconds, buildMinuteSecondValues, SECONDS_PER_MINUTE } from './minuteAlertSeconds';

import type { CriticalPoint } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';

const DEG_PER_SECOND = 360 / SECONDS_PER_MINUTE;
const ANGLE_OFFSET_DEG = -DEG_PER_SECOND / 2;

/** Инвертированная зона наведения шире видимого сектора — по дуге всего ~5px, точно попасть трудно. */
const HOVER_HIT_PADDING = 4.5;

type MinuteAlertRingProps = {
  events: CriticalPoint[];
  timestamp: number;
  color: string;
  metric: Metric;
};

/** Точка на окружности: 0° — сверху (12 часов), угол растёт по часовой стрелке. */
function pointOnCircle(radius: number, angleDeg: number): { x: number; y: number; } {
  const angleRad = (angleDeg * Math.PI) / 180;

  return { x: radius * Math.sin(angleRad), y: -radius * Math.cos(angleRad) };
}

/** Кольцевой сектор (donut slice) между innerR и outerR на угловом диапазоне [angleStart, angleEnd]. */
function annularSectorPath(innerR: number, outerR: number, angleStart: number, angleEnd: number): string {
  const outerStart = pointOnCircle(outerR, angleStart);
  const outerEnd = pointOnCircle(outerR, angleEnd);
  const innerStart = pointOnCircle(innerR, angleStart);
  const innerEnd = pointOnCircle(innerR, angleEnd);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function formatSecondTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Кольцо из 60 дуг-секунд минуты события: красная секунда — был алерт, иначе цвет батареи. */
export function MinuteAlertRing({ events, timestamp, color, metric }: MinuteAlertRingProps) {
  const [hoveredSecond, setHoveredSecond] = useState<number | null>(null);

  const alertSeconds = buildMinuteAlertSeconds(events, timestamp);
  const minuteStart = Math.floor(timestamp / MINUTE_MS) * MINUTE_MS;

  const secondValues = buildMinuteSecondValues(events, timestamp);

  const hoveredValue = hoveredSecond !== null ? secondValues.get(hoveredSecond) : undefined;

  const size = (TOOLTIP_RING_RADIUS + TOOLTIP_RING_STROKE_WIDTH) * 2;
  const innerR = TOOLTIP_RING_RADIUS - TOOLTIP_RING_STROKE_WIDTH / 2;
  const outerR = TOOLTIP_RING_RADIUS + TOOLTIP_RING_STROKE_WIDTH / 2;

  return (
    <svg
      className='chart-tooltip__ring'
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
      {alertSeconds.map((hasAlert, second) => {
        const angleStart = second * DEG_PER_SECOND + ANGLE_OFFSET_DEG + TOOLTIP_RING_GAP_DEG / 2;
        const angleEnd = (second + 1) * DEG_PER_SECOND + ANGLE_OFFSET_DEG - TOOLTIP_RING_GAP_DEG / 2;

        if (!hasAlert) {
          return (
            <path
              key={second}
              d={annularSectorPath(innerR, outerR, angleStart, angleEnd)}
              fill={color}
              fillOpacity={0.35}
            />
          );
        }

        // Наведение ловит неподвижный hit-path — сам сектор после scale() уезжает из-под
        // курсора, и hover на нём же вызвал бы бесконечный дребезг (:hover → уезжает → :hover
        // слетает → возвращается → :hover снова).
        return (
          <g key={second} className='chart-tooltip__ring-tick-wrap'>
            <path
              d={annularSectorPath(innerR - HOVER_HIT_PADDING, outerR + HOVER_HIT_PADDING, angleStart, angleEnd)}
              fill='transparent'
              pointerEvents='fill'
              onMouseEnter={() => setHoveredSecond(second)}
              onMouseLeave={() => setHoveredSecond(null)}
            />

            {/* Неподвижная база — всегда закрывает исходный сектор, чтобы уехавший при
                hover анимированный сектор читался как удлинение, а не переезд. */}
            <path d={annularSectorPath(innerR, outerR, angleStart, angleEnd)} fill={TONE_COLOR.danger} pointerEvents='none' />

            <path
              className='chart-tooltip__ring-tick--alert'
              d={annularSectorPath(innerR, outerR, angleStart, angleEnd)}
              fill={TONE_COLOR.danger}
              pointerEvents='none'
            />
          </g>
        );
      })}

      <text className='chart-tooltip__ring-zero-label' x={0} y={-(outerR + 10)} textAnchor='middle'>
        0
      </text>

      <text className='chart-tooltip__ring-time' textAnchor='middle' dominantBaseline='middle'>
        {formatSecondTime(minuteStart + (hoveredSecond ?? 0) * 1000)}
      </text>

      {hoveredValue !== undefined && (
        <text className='chart-tooltip__ring-value' textAnchor='middle' y={20}>
          {hoveredValue.toFixed(2)}{METRIC_UNIT[metric]}
        </text>
      )}
    </svg>
  );
}

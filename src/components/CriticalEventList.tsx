import { formatMetricWithUnit } from './metricFormat';
import { TONE_COLOR } from './thresholds';

import type { EventListLayout } from './eventListLayout';

import type { CriticalPoint } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';

type CriticalEventListProps = {
  layout: EventListLayout;
  /** Координаты ромба события на площадке графика. */
  x: (event: CriticalPoint) => number;
  y: (event: CriticalPoint) => number;
  innerWidth: number;
  innerHeight: number;
  metric: Metric;
};

/** Отступ разделителя от площадки: диагонали соединителей укладываются левее него. */
const DIVIDER_OFFSET = 30;

/** Якорь строки — правее разделителя, чтобы линия пересекала границу, а не упиралась в неё. */
const ANCHOR_OFFSET = 16;

const ANCHOR_RADIUS = 2.5;

/** Горизонтальные хвосты ломаной: у ромба и перед якорем. */
const MARK_STUB = 6;
const LEAD_STUB = 18;
const ANCHOR_STUB = 14;

const LINK_OPACITY = 0.45;

const FONT_SIZE = 12;

/** Базовая линия текста относительно y строки: центрирует строку по её высоте. */
const TEXT_BASELINE = 4;

function formatMoment(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/*
 * Панель критических событий справа от графика: группа на батарею, строка на событие,
 * ломаная от ромба к строке. Рисуется вне PlotArea — её clipPath обрезал бы соединители
 * по правому краю площадки.
 */
export function CriticalEventList({ layout, x, y, innerWidth, innerHeight, metric }: CriticalEventListProps) {
  const dividerX = innerWidth + DIVIDER_OFFSET;

  const anchorX = dividerX + ANCHOR_OFFSET;

  const textX = anchorX + 10;

  const valueX = dividerX + layout.width;

  return (
    <g pointerEvents='none' fontSize={FONT_SIZE}>
      <line
        x1={dividerX}
        x2={dividerX}
        y1={0}
        y2={innerHeight}
        stroke='#ddd'
        strokeWidth={1}
      />

      {/* Соединители — первыми: текст и якоря ложатся поверх. */}

      {layout.rows.map((row) => {
        const markX = x(row.event);

        const markY = y(row.event);

        const points = [
          [markX + MARK_STUB, markY],
          [markX + LEAD_STUB, markY],
          [anchorX - ANCHOR_STUB, row.y],
          [anchorX, row.y],
        ];

        return (
          <polyline
            key={`${row.battery}-${row.event.timestamp}-${row.event.value}`}
            points={points.map(([px, py]) => `${px},${py}`).join(' ')}
            fill='none'
            stroke={row.color}
            strokeWidth={1}
            strokeLinejoin='round'
            opacity={LINK_OPACITY}
          />
        );
      })}

      <text x={anchorX} y={TEXT_BASELINE} fill='#666' fontWeight={600} letterSpacing={0.5}>
        КРИТИЧЕСКИЕ СОБЫТИЯ {layout.total}
      </text>

      {layout.groups.map((group) => (
        <text
          key={group.battery}
          x={anchorX}
          y={group.y + TEXT_BASELINE}
          fill={group.color}
          fontWeight={600}>
          ● {group.battery} · {group.count}
        </text>
      ))}

      {layout.rows.map((row) => (
        <g key={`${row.battery}-${row.event.timestamp}-${row.event.value}`}>
          <circle cx={anchorX} cy={row.y} r={ANCHOR_RADIUS} fill={row.color} />

          <text x={textX} y={row.y + TEXT_BASELINE} fill='#333'>
            {formatMoment(row.event.timestamp)}
          </text>

          <text
            x={valueX}
            y={row.y + TEXT_BASELINE}
            textAnchor='end'
            fill={TONE_COLOR.danger}
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatMetricWithUnit(row.event.value, metric)}
          </text>
        </g>
      ))}
    </g>
  );
}

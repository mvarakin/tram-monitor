import { formatMetricWithUnit } from './metricFormat';
import { isSameEvent } from './eventListLayout';
import {
  TONE_COLOR,
  ROW_HEIGHT,
  DIVIDER_OFFSET,
  ANCHOR_OFFSET,
  ANCHOR_RADIUS,
  MARK_STUB,
  LEAD_STUB,
  ANCHOR_STUB,
  LINK_OPACITY,
  BACKGROUND_OPACITY,
  FONT_SIZE,
  TEXT_BASELINE,
} from '../constants';

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

/*
 * Панель критических событий справа от графика: группа на батарею, строка на событие,
 * ломаная от ромба к строке. Рисуется вне PlotArea — её clipPath обрезал бы соединители
 * по правому краю площадки.
 */
export function CriticalEventList({ layout, x, y, innerWidth, innerHeight, metric, hovered, onHover, onLeave }: CriticalEventListProps) {
  const dividerX = innerWidth + DIVIDER_OFFSET;

  const anchorX = dividerX + ANCHOR_OFFSET;

  const textX = anchorX + 10;

  const valueX = dividerX + layout.width;

  return (
    <g fontSize={FONT_SIZE}>
      <line
        x1={dividerX}
        x2={dividerX}
        y1={0}
        y2={innerHeight}
        stroke='#ddd'
        strokeWidth={1}
        pointerEvents='none'
      />

      {/* Фоны строк — первыми, потом соединители, потом текст. */}

      {layout.rows.map((row) => {
        const isHovered = isSameEvent(hovered, row.battery, row.event);

        if (!isHovered) {
          return null;
        }

        return (
          <rect
            key={`bg-${row.battery}-${row.event.timestamp}-${row.event.value}`}
            x={dividerX}
            y={row.y - ROW_HEIGHT / 2}
            width={layout.width}
            height={ROW_HEIGHT}
            fill={row.color}
            opacity={BACKGROUND_OPACITY}
            pointerEvents='none'
          />
        );
      })}

      {/* Соединители — после фонов, перед текстом. */}

      {/* Линия ромб → строка скрыта (не удалена), возможно вернём позже.
      {layout.rows.map((row) => {
        const markX = x(row.event);

        const markY = y(row.event);

        const isHovered = isSameEvent(hovered, row.battery, row.event);

        if (!isHovered) {
          return null;
        }

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
            pointerEvents='none'
          />
        );
      })}
      */}

      <text x={anchorX} y={TEXT_BASELINE} fill='#666' fontWeight={600} letterSpacing={0.5} pointerEvents='none'>
        КРИТИЧЕСКИЕ СОБЫТИЯ {layout.total}
      </text>

      {layout.groups.map((group) => (
        <text
          key={group.battery}
          x={anchorX}
          y={group.y + TEXT_BASELINE}
          fill={group.color}
          fontWeight={600}
          pointerEvents='none'>
          ● {group.battery} · {group.count}
        </text>
      ))}

      {layout.rows.map((row) => (
        <g key={`${row.battery}-${row.event.timestamp}-${row.event.value}`}>
          <rect
            x={dividerX}
            y={row.y - ROW_HEIGHT / 2}
            width={layout.width}
            height={ROW_HEIGHT}
            fill='transparent'
            onMouseEnter={() => onHover(row.event, row.battery)}
            onMouseLeave={onLeave}
            cursor='pointer'
          />

          <circle cx={anchorX} cy={row.y} r={ANCHOR_RADIUS} fill={row.color} pointerEvents='none' />

          <text x={textX} y={row.y + TEXT_BASELINE} fill='#333' pointerEvents='none'>
            {formatMoment(row.event.timestamp)}
          </text>

          <text
            x={valueX}
            y={row.y + TEXT_BASELINE}
            textAnchor='end'
            fill={TONE_COLOR.danger}
            style={{ fontVariantNumeric: 'tabular-nums' }}
            pointerEvents='none'>
            {formatMetricWithUnit(row.event.value, metric)}
          </text>
        </g>
      ))}
    </g>
  );
}

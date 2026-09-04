import { useState, type MouseEvent } from 'react';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';

import {
  CROSSHAIR_DASHARRAY,
  CROSSHAIR_OPACITY,
  MARK_HIT_PADDING,
  MARK_MIN_HEIGHT,
  MARK_MIN_WIDTH,
  METRIC_UNIT,
  MINUTE_BARS_MARGIN,
  MINUTE_BARS_TARGET_TICKS,
  MINUTE_BARS_TICK_MIN_STEP,
  MINUTE_BARS_X_TICK_STEP,
  MINUTE_MS,
  TONE_COLOR,
  TOOLTIP_RING_RADIUS,
  TOOLTIP_RING_STROKE_WIDTH,
} from '../constants';
import { DangerZone } from './DangerZone';
import { buildMinuteSecondValues, SECONDS_PER_MINUTE } from './minuteAlertSeconds';
import { getDanger } from './thresholds';
import { buildValueTicks, valueTickLabelProps } from './valueTicks';

import type { CriticalPoint } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';

type MinuteAlertBarsProps = {
  events: CriticalPoint[];
  timestamp: number;
  color: string;
  metric: Metric;
};

/** Отступ подписи наведённого бара от его верха. */
const HOVER_LABEL_GAP = 4;

function formatSecondTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function xTickAnchor(second: number): 'start' | 'middle' | 'end' {
  if (second === 0) return 'start';
  if (second === SECONDS_PER_MINUTE) return 'end';
  return 'middle';
}

/** Подпись не измеряется: у краёв поля она прижимается к бару нужной стороной и не вылезает за границы. */
function labelAnchor(x: number, width: number): 'start' | 'middle' | 'end' {
  if (x < width / 3) return 'start';
  if (x > (width * 2) / 3) return 'end';
  return 'middle';
}

/**
 * Гистограмма алертов минуты: по X — секунды 0–60, по Y — значение метрики. Занимает тот же бокс,
 * что кольцо, — переключение вида не меняет размер карточки тултипа (её позиция и стрелка
 * считаются по замеру при открытии).
 */
export function MinuteAlertBars({ events, timestamp, color, metric }: MinuteAlertBarsProps) {
  const [hoveredSecond, setHoveredSecond] = useState<number | null>(null);

  const size = (TOOLTIP_RING_RADIUS + TOOLTIP_RING_STROKE_WIDTH) * 2;
  const innerWidth = size - MINUTE_BARS_MARGIN.left - MINUTE_BARS_MARGIN.right;
  const innerHeight = size - MINUTE_BARS_MARGIN.top - MINUTE_BARS_MARGIN.bottom;

  const minuteStart = Math.floor(timestamp / MINUTE_MS) * MINUTE_MS;

  // Посекундной телеметрии нет — известны только секунды с критическими событиями, остальные пустые.
  const bars = [...buildMinuteSecondValues(events, timestamp)]
    .map(([second, value]) => ({ second, value }))
    .sort((a, b) => a.second - b.second);

  const values = bars.map((bar) => bar.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;

  const danger = getDanger(metric);

  const yTicks = buildValueTicks(minValue, maxValue, MINUTE_BARS_TARGET_TICKS, MINUTE_BARS_TICK_MIN_STEP[metric]);

  // Домен обрезан по данным: снизу ровно minValue (иначе запас EDGE_TICKS читается так, будто
  // столбик растёт из значения, которого у него нет), сверху — ближайший кратный шагу тик не ниже
  // maxValue. Иначе на узком диапазоне минуты столбики занимали бы меньше половины высоты.
  const step = yTicks[1] - yTicks[0];
  const ceiledMax = Number((Math.ceil(maxValue / step) * step).toFixed(10));
  const topTick = ceiledMax > minValue ? ceiledMax : Number((minValue + step).toFixed(10));

  const xScale = scaleLinear({ domain: [0, SECONDS_PER_MINUTE], range: [0, innerWidth] });
  const yScale = scaleLinear({ domain: [minValue, topTick], range: [innerHeight, 0] });

  // Низ оси подписан всегда: minValue не обязан лежать на сетке шага, а ось X без подписи рядом
  // читается как «ноль».
  const visibleYTicks = [
    minValue,
    ...yTicks.filter((tick) => tick > minValue && tick <= topTick),
  ];

  const xTicks: number[] = [];
  for (let second = 0; second <= SECONDS_PER_MINUTE; second += MINUTE_BARS_X_TICK_STEP) {
    xTicks.push(second);
  }

  const barWidth = Math.max(innerWidth / SECONDS_PER_MINUTE, MARK_MIN_WIDTH);

  const hoveredBar = bars.find((bar) => bar.second === hoveredSecond);

  /** Ближайший к курсору бар, если он в пределах щедрой зоны попадания. */
  function handleMouseMove(event: MouseEvent<SVGRectElement>) {
    const cursorX = event.nativeEvent.offsetX - MINUTE_BARS_MARGIN.left;

    let nearest: { second: number; distance: number; } | null = null;

    for (const { second } of bars) {
      const distance = Math.abs(xScale(second + 0.5) - cursorX);

      if (nearest === null || distance < nearest.distance) {
        nearest = { second, distance };
      }
    }

    const reach = barWidth / 2 + MARK_HIT_PADDING;

    setHoveredSecond(nearest !== null && nearest.distance <= reach ? nearest.second : null);
  }

  return (
    <svg className='chart-tooltip__bars' width={size} height={size}>
      <Group left={MINUTE_BARS_MARGIN.left} top={MINUTE_BARS_MARGIN.top}>
        {/* Порог ниже домена — зона накрыла бы всё поле, а её пунктир лёг бы на ось X. */}
        {danger >= minValue && <DangerZone y={yScale(danger)} width={innerWidth} height={innerHeight} />}

        {bars.map(({ second, value }) => {
          const center = xScale(second + 0.5);
          const y = yScale(value);

          return (
            <g key={second}>
              <rect
                x={center - barWidth / 2}
                y={Math.min(y, innerHeight - MARK_MIN_HEIGHT)}
                width={barWidth}
                height={Math.max(innerHeight - y, MARK_MIN_HEIGHT)}
                fill={value > danger ? TONE_COLOR.danger : color}
                fillOpacity={value > danger ? 1 : 0.35}
                pointerEvents='none'
              />
            </g>
          );
        })}

        {/* Одна зона на всё поле с выбором ближайшего бара: у каждого бара своя хит-зона была бы
            шире слота секунды (~3px), соседние перекрывались бы, и бар слева не наводился вовсе. */}
        <rect
          x={0}
          y={0}
          width={innerWidth}
          height={innerHeight}
          fill='transparent'
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredSecond(null)}
        />

        {hoveredBar && (
          <>
            <line
              x1={0}
              x2={xScale(hoveredBar.second + 0.5)}
              y1={yScale(hoveredBar.value)}
              y2={yScale(hoveredBar.value)}
              stroke={TONE_COLOR.danger}
              strokeDasharray={CROSSHAIR_DASHARRAY}
              strokeOpacity={CROSSHAIR_OPACITY}
              pointerEvents='none'
            />

            <text
              className='chart-tooltip__bars-label'
              x={Math.min(Math.max(xScale(hoveredBar.second + 0.5), 0), innerWidth)}
              y={Math.max(yScale(hoveredBar.value) - HOVER_LABEL_GAP, 0)}
              textAnchor={labelAnchor(xScale(hoveredBar.second + 0.5), innerWidth)}
              pointerEvents='none'>
              {formatSecondTime(minuteStart + hoveredBar.second * 1000)} · {hoveredBar.value.toFixed(2)}
              {METRIC_UNIT[metric]}
            </text>
          </>
        )}

        <AxisBottom
          top={innerHeight}
          scale={xScale}
          tickValues={xTicks}
          tickLength={4}
          tickFormat={(value) => String(value)}
          // Крайние подписи прижимаются к своему краю — центрированные «0» и «60» вылезли бы за SVG.
          tickLabelProps={(value) => ({
            dy: '0.25em',
            fontFamily: 'Arial',
            fontSize: 10,
            textAnchor: xTickAnchor(Number(value)),
          })}
        />

        <AxisLeft
          scale={yScale}
          tickValues={visibleYTicks}
          tickLength={4}
          // Не formatMetricWithUnit: тот округляет температуру до целых, и половинные тики дублировались бы.
          tickFormat={(value) => Number(value).toFixed(1)}
          tickLabelProps={valueTickLabelProps(danger)}
        />
      </Group>
    </svg>
  );
}

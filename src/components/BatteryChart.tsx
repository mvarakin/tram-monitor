import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveLinear } from '@visx/curve';
import { Group } from '@visx/group';
import { scaleLinear, scaleTime } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { useRef, useState, type MouseEvent } from 'react';

import { getBatteryColor } from './batteryColors';
import { BatteryLegend } from './BatteryLegend';
import { ChartTooltip } from './ChartTooltip';
import { buildChartLayout } from './chartLayout';
import { CriticalEventList } from './CriticalEventList';
import { CriticalEventMarks } from './CriticalEventMarks';
import { CrosshairLines } from './CrosshairLines';
import { buildEventListLayout } from './eventListLayout';
import { formatMetricWithUnit } from './metricFormat';
import { PlotArea } from './PlotArea';
import { buildTimeTicks } from './timeTicks';
import { getLocalDayRange } from '../time';
import { TEMPERATURE_DANGER, VOLTAGE_DANGER, HOUR_MS, HALF_HOUR_MS, SINGLE_POINT_RADIUS } from '../constants';

import type { BatteryCriticalEvents, BatterySegments, CriticalPoint, Point } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';

type BatteryChartProps = {
  segmentsByBattery: BatterySegments;
  eventsByBattery: BatteryCriticalEvents;
  metric: Metric;
  from: string;
};

function formatTick(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Событие, которое пользователь смотрит: наведение на ромб (с позицией) или на строку (без позиции). */
type HoveredEvent = {
  battery: string;
  event: CriticalPoint;
  /** Есть только при наведении на ромб — включает ChartTooltip и CrosshairLines. */
  pointer?: { left: number; top: number };
};

export function BatteryChart({ segmentsByBattery, eventsByBattery, metric, from }: BatteryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [hovered, setHovered] = useState<HoveredEvent | null>(null);

  /*
   * svg тянется по ширине контейнера, поэтому его внутренние координаты не совпадают
   * с экранными: позицию берём из курсора и пересчитываем относительно контейнера.
   */
  const showTooltip = (event: CriticalPoint, battery: string, pointer: MouseEvent) => {
    const bounds = containerRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    setHovered({
      battery,
      event,
      pointer: {
        left: pointer.clientX - bounds.left,
        top: pointer.clientY - bounds.top,
      },
    });
  };

  const showLink = (event: CriticalPoint, battery: string) => {
    setHovered({ battery, event });
  };

  const clearHovered = () => setHovered(null);

  // Батарея может быть представлена только событиями: avg за период не пришёл ни разу.
  const batteries = [...new Set([...Object.keys(segmentsByBattery), ...Object.keys(eventsByBattery)])];

  if (batteries.length === 0) {
    return null;
  }

  // Панель забирает место у правого поля и задаёт минимальную высоту чарта.
  const panel = buildEventListLayout(batteries, eventsByBattery);

  const { width, height, margin, innerWidth, innerHeight } = buildChartLayout(panel);

  const danger = metric === 'temperature' ? TEMPERATURE_DANGER : VOLTAGE_DANGER;

  const [firstTimestamp, lastTimestamp] = getLocalDayRange(new Date(from).getTime());

  const values = [
    ...batteries.flatMap((battery) => (segmentsByBattery[battery] ?? []).flat().map((point) => point.value)),
    ...batteries.flatMap((battery) => (eventsByBattery[battery] ?? []).map((event) => event.value)),
  ];

  // Домен включает значения событий: иначе PlotArea обрежет ромбы выброса.
  const domainMin = Math.min(...values, danger);

  const domainMax = Math.max(...values, danger);

  const padding = (domainMax - domainMin) * 0.1 || 1;

  const xScale = scaleTime<number>({
    domain: [firstTimestamp, lastTimestamp],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear<number>({
    domain: [domainMin - padding, domainMax + padding],
    range: [innerHeight, 0],
  });

  const hourTicks = buildTimeTicks(firstTimestamp, lastTimestamp, HOUR_MS);

  const hourTickSet = new Set(hourTicks);

  // Только «середины»: на целых часах уже стоит длинная засечка.
  const halfHourTicks = buildTimeTicks(firstTimestamp, lastTimestamp, HALF_HOUR_MS).filter(
    (tick) => !hourTickSet.has(tick),
  );

  return (
    <>
      <div className='chart-plot' ref={containerRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width='100%'
          preserveAspectRatio='xMidYMid meet'
          style={{ display: 'block' }}>
          <Group left={margin.left} top={margin.top}>
            <PlotArea width={innerWidth} height={innerHeight}>
              {/* Линия порога */}

              <line
                x1={0}
                x2={innerWidth}
                y1={yScale(danger)}
                y2={yScale(danger)}
                stroke='red'
                strokeDasharray='6 4'
                strokeWidth={1}
              />

              {/* Линия avg. Каждый сегмент рисуется отдельно — между ними данных не было. */}

              {batteries.map((battery, index) => {
                const color = getBatteryColor(index);

                const segments = segmentsByBattery[battery] ?? [];

                return (
                  <g key={battery}>
                    {segments.map((segment) =>
                      segment.length === 1 ? (
                        <circle
                          key={segment[0].timestamp}
                          cx={xScale(segment[0].timestamp) ?? 0}
                          cy={yScale(segment[0].value)}
                          r={SINGLE_POINT_RADIUS}
                          fill={color}
                        />
                      ) : (
                        <LinePath<Point>
                          key={segment[0].timestamp}
                          data={segment}
                          x={(point) => xScale(point.timestamp) ?? 0}
                          y={(point) => yScale(point.value)}
                          curve={curveLinear}
                          stroke={color}
                          strokeWidth={1.5}
                          fill='none'
                        />
                      ),
                    )}
                  </g>
                );
              })}

              {/* Направляющие события — показываются при любом hover (ромб или строка). */}

              {hovered && (
                <CrosshairLines
                  x={xScale(hovered.event.timestamp) ?? 0}
                  y={yScale(hovered.event.value)}
                  bottom={innerHeight}
                />
              )}

              {/* Марки событий — последними, чтобы ромбы легли поверх линий. */}

              {batteries.map((battery) => (
                <CriticalEventMarks
                  key={battery}
                  battery={battery}
                  events={eventsByBattery[battery] ?? []}
                  x={(event) => xScale(event.timestamp) ?? 0}
                  y={(event) => yScale(event.value)}
                  onHover={showTooltip}
                  onLeave={clearHovered}
                  hovered={hovered}
                />
              ))}
            </PlotArea>

            {/* Панель событий — вне PlotArea: соединители пересекают правую границу площадки. */}

            {panel && (
              <CriticalEventList
                layout={panel}
                x={(event) => xScale(event.timestamp) ?? 0}
                y={(event) => yScale(event.value)}
                innerWidth={innerWidth}
                innerHeight={innerHeight}
                metric={metric}
                hovered={hovered}
                onHover={showLink}
                onLeave={clearHovered}
              />
            )}

            <AxisLeft
              scale={yScale}
              numTicks={8}
              tickFormat={(value) => formatMetricWithUnit(Number(value), metric)}
            />

            {/* Получасовые засечки — первыми: часовые ложатся поверх. */}

            <AxisBottom
              top={innerHeight}
              scale={xScale}
              tickValues={halfHourTicks}
              tickFormat={() => ''}
              hideAxisLine
              tickLength={4}
              tickStroke='#bbb'
            />

            <AxisBottom
              top={innerHeight}
              scale={xScale}
              tickValues={hourTicks}
              tickLength={8}
              tickFormat={(value) => formatTick(Number(value))}
            />
          </Group>
        </svg>

        {hovered?.pointer && (
          <ChartTooltip
            left={hovered.pointer.left}
            top={hovered.pointer.top}
            battery={hovered.battery}
            color={getBatteryColor(batteries.indexOf(hovered.battery))}
            timestamp={hovered.event.timestamp}
            value={hovered.event.value}
            metric={metric}
          />
        )}
      </div>

      <BatteryLegend
        items={batteries.map((battery, index) => ({
          label: battery,
          color: getBatteryColor(index),
        }))}
      />
    </>
  );
}

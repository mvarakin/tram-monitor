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
import { TEMPERATURE_DANGER, VOLTAGE_DANGER } from './thresholds';
import { buildTimeTicks, HALF_HOUR_MS, HOUR_MS } from './timeTicks';

import type { BatteryCriticalEvents, BatterySegments, CriticalPoint, Point } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';

type BatteryChartProps = {
  segmentsByBattery: BatterySegments;
  eventsByBattery: BatteryCriticalEvents;
  metric: Metric;
  from: string;
  to: string;
};

/** Радиус точки для сегмента из одной минуты: одиночный moveto в SVG-пути невидим. */
const SINGLE_POINT_RADIUS = 1.5;

function formatTick(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Событие под курсором вместе с позицией подсказки в пикселях контейнера. */
type TooltipState = {
  left: number;
  top: number;
  battery: string;
  event: CriticalPoint;
};

export function BatteryChart({ segmentsByBattery, eventsByBattery, metric, from, to }: BatteryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  /*
   * svg тянется по ширине контейнера, поэтому его внутренние координаты не совпадают
   * с экранными: позицию берём из курсора и пересчитываем относительно контейнера.
   */
  const showTooltip = (event: CriticalPoint, battery: string, pointer: MouseEvent) => {
    const bounds = containerRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    setTooltip({
      left: pointer.clientX - bounds.left,
      top: pointer.clientY - bounds.top,
      battery,
      event,
    });
  };

  const hideTooltip = () => setTooltip(null);

  // Батарея может быть представлена только событиями: avg за период не пришёл ни разу.
  const batteries = [...new Set([...Object.keys(segmentsByBattery), ...Object.keys(eventsByBattery)])];

  if (batteries.length === 0) {
    return null;
  }

  // Панель забирает место у правого поля и задаёт минимальную высоту чарта.
  const panel = buildEventListLayout(batteries, eventsByBattery);

  const { width, height, margin, innerWidth, innerHeight } = buildChartLayout(panel);

  const danger = metric === 'temperature' ? TEMPERATURE_DANGER : VOLTAGE_DANGER;

  const firstTimestamp = new Date(from).getTime();

  const lastTimestamp = new Date(to).getTime();

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

              {/* Направляющие события под курсором — под ромбами, чтобы ромб остался цельным. */}

              {tooltip && (
                <CrosshairLines
                  x={xScale(tooltip.event.timestamp) ?? 0}
                  y={yScale(tooltip.event.value)}
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
                  onLeave={hideTooltip}
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

        {tooltip && (
          <ChartTooltip
            left={tooltip.left}
            top={tooltip.top}
            battery={tooltip.battery}
            color={getBatteryColor(batteries.indexOf(tooltip.battery))}
            timestamp={tooltip.event.timestamp}
            value={tooltip.event.value}
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

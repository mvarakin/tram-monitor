import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveLinear } from '@visx/curve';
import { Group } from '@visx/group';
import { scaleLinear, scaleTime } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';

import { getBatteryColor } from './batteryColors';
import { BatteryEventPanel } from './BatteryEventPanel';
import { BatteryLegend } from './BatteryLegend';
import { ChartTooltip } from './ChartTooltip';
import { buildChartLayout } from './chartLayout';
import { CriticalEventMarks } from './CriticalEventMarks';
import { CrosshairLines } from './CrosshairLines';
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
  to: string;
};

function formatTick(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

type HoveredEvent = {
  battery: string;
  event: CriticalPoint;
  pointer?: { left: number; top: number };
};

type ChartCanvasProps = {
  svgRef: RefObject<SVGSVGElement | null>;
  width: number;
  height: number;
  batteries: string[];
  segmentsByBattery: BatterySegments;
  eventsByBattery: BatteryCriticalEvents;
  metric: Metric;
  from: string;
  to: string;
  hovered: HoveredEvent | null;
  onHover: (event: CriticalPoint, battery: string, pointer: MouseEvent) => void;
  onLeave: () => void;
};

/** Сам график: рисуется только когда известны размеры контейнера. */
function ChartCanvas({
  svgRef,
  width,
  height,
  batteries,
  segmentsByBattery,
  eventsByBattery,
  metric,
  from,
  to,
  hovered,
  onHover,
  onLeave,
}: ChartCanvasProps) {
  const { margin, innerWidth, innerHeight } = buildChartLayout(width, height);

  const danger = metric === 'temperature' ? TEMPERATURE_DANGER : VOLTAGE_DANGER;

  const fromTimestamp = new Date(from).getTime();
  const toTimestamp = new Date(to).getTime();

  // Используем переданные от и до, если доступны; иначе — локальный день
  const [firstTimestamp, lastTimestamp] = toTimestamp > fromTimestamp
    ? [fromTimestamp, toTimestamp]
    : getLocalDayRange(fromTimestamp);

  const values = [
    ...batteries.flatMap((battery) => (segmentsByBattery[battery] ?? []).flat().map((point) => point.value)),
    ...batteries.flatMap((battery) => (eventsByBattery[battery] ?? []).map((event) => event.value)),
  ];

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

  const halfHourTicks = buildTimeTicks(firstTimestamp, lastTimestamp, HALF_HOUR_MS).filter(
    (tick) => !hourTickSet.has(tick),
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ display: 'block' }}>
      <Group left={margin.left} top={margin.top}>
        <PlotArea width={innerWidth} height={innerHeight}>
          <line
            x1={0}
            x2={innerWidth}
            y1={yScale(danger)}
            y2={yScale(danger)}
            stroke='red'
            strokeDasharray='6 4'
            strokeWidth={1}
          />

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

          {hovered && (
            <CrosshairLines
              x={xScale(hovered.event.timestamp) ?? 0}
              y={yScale(hovered.event.value)}
              bottom={innerHeight}
            />
          )}

          {batteries.map((battery) => (
            <CriticalEventMarks
              key={battery}
              battery={battery}
              events={eventsByBattery[battery] ?? []}
              x={(event) => xScale(event.timestamp) ?? 0}
              y={(event) => yScale(event.value)}
              onHover={onHover}
              onLeave={onLeave}
              hovered={hovered}
            />
          ))}
        </PlotArea>

        <AxisLeft
          scale={yScale}
          numTicks={8}
          tickFormat={(value) => formatMetricWithUnit(Number(value), metric)}
        />

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
  );
}

export function BatteryChart({ segmentsByBattery, eventsByBattery, metric, from, to }: BatteryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [hovered, setHovered] = useState<HoveredEvent | null>(null);
  const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Размеры берём из entry: ref может указывать на другой узел после перерисовки
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      setMeasuredSize((previous) =>
        previous && previous.width === width && previous.height === height ? previous : { width, height },
      );
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const showTooltip = (event: CriticalPoint, battery: string, pointer: MouseEvent) => {
    const bounds = svgRef.current?.getBoundingClientRect();

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

  const batteries = [...new Set([...Object.keys(segmentsByBattery), ...Object.keys(eventsByBattery)])];

  if (batteries.length === 0) {
    return null;
  }

  return (
    <div className='chart-body'>
      <div className='chart-row'>
        {/* Разметка одинакова до и после замера: иначе ResizeObserver останется на чужом узле */}
        <div className='chart-plot' ref={containerRef}>
          {measuredSize && (
            <ChartCanvas
              svgRef={svgRef}
              width={measuredSize.width}
              height={measuredSize.height}
              batteries={batteries}
              segmentsByBattery={segmentsByBattery}
              eventsByBattery={eventsByBattery}
              metric={metric}
              from={from}
              to={to}
              hovered={hovered}
              onHover={showTooltip}
              onLeave={clearHovered}
            />
          )}

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

        <div className='battery-events'>
          {batteries.map((battery, index) => (
            <BatteryEventPanel
              key={battery}
              battery={battery}
              color={getBatteryColor(index)}
              events={eventsByBattery[battery] ?? []}
              metric={metric}
              hovered={hovered}
              onHover={showLink}
              onLeave={clearHovered}
            />
          ))}
        </div>
      </div>

      <BatteryLegend
        items={batteries.map((battery, index) => ({
          label: battery,
          color: getBatteryColor(index),
        }))}
      />
    </div>
  );
}

import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { getBatteryColor } from './batteryColors';
import { BatteryEventPanel } from './BatteryEventPanel';
import { BatteryLegend } from './BatteryLegend';
import { buildChartScales, type ChartScales } from './chartScales';
import { ChartTooltip } from './ChartTooltip';
import { clampSpan, CriticalEventMarks } from './CriticalEventMarks';
import { CrosshairLines } from './CrosshairLines';
import { findMinuteGroup } from './minuteGroups';
import { formatMetricWithUnit, roundMetricValue } from './metricFormat';
import { NowLine } from './NowLine';
import { PlotArea } from './PlotArea';
import { buildTimeTicks } from './timeTicks';
import { useEventSelection, type SelectedEvent } from './useEventSelection';
import { getLocalDayRange } from '../time';
import { HOUR_MS, HALF_HOUR_MS, MARK_MIN_HEIGHT, METRIC_TICK_MIN_STEP } from '../constants';

import type { BatteryCriticalEvents, CriticalPoint } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';

type AlertsChartProps = {
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
};

type ChartCanvasProps = {
  svgRef: RefObject<SVGSVGElement | null>;
  width: number;
  height: number;
  batteries: string[];
  eventsByBattery: BatteryCriticalEvents;
  metric: Metric;
  scales: ChartScales;
  firstTimestamp: number;
  lastTimestamp: number;
  now: number;
  hovered: HoveredEvent | null;
  selected: SelectedEvent | null;
  selectedGroup: CriticalPoint[];
  onHover: (event: CriticalPoint, battery: string) => void;
  onLeave: () => void;
  onClickMark: (event: CriticalPoint, battery: string) => void;
};

/** Только ромбы критических событий на осях времени/значения — без линий телеметрии и без порога. */
function ChartCanvas({
  svgRef,
  width,
  height,
  batteries,
  eventsByBattery,
  metric,
  scales,
  firstTimestamp,
  lastTimestamp,
  now,
  hovered,
  selected,
  selectedGroup,
  onHover,
  onLeave,
  onClickMark,
}: ChartCanvasProps) {
  const { margin, innerWidth, innerHeight, xScale, yScale, yTicks } = scales;

  const hourTicks = buildTimeTicks(firstTimestamp, lastTimestamp, HOUR_MS);

  const hourTickSet = new Set(hourTicks);

  const halfHourTicks = buildTimeTicks(firstTimestamp, lastTimestamp, HALF_HOUR_MS).filter(
    (tick) => !hourTickSet.has(tick),
  );

  // Пока тултип открыт, а курсор ушёл с метки — направляющие остаются на выбранной точке.
  const active = hovered ?? selected;

  const activeMinValue = active
    ? Math.min(...findMinuteGroup(eventsByBattery[active.battery] ?? [], active.event).map((event) => event.value))
    : 0;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ display: 'block' }}>
      <Group left={margin.left} top={margin.top}>
        <PlotArea width={innerWidth} height={innerHeight}>
          {active && (
            <CrosshairLines
              x={xScale(active.event.timestamp) ?? 0}
              y={yScale(roundMetricValue(active.event.value, metric))}
              yMin={yScale(roundMetricValue(activeMinValue, metric))}
              bottom={innerHeight}
            />
          )}

          {now >= firstTimestamp && now <= lastTimestamp && <NowLine x={xScale(now) ?? 0} bottom={innerHeight} />}

          {batteries.map((battery, index) => (
            <CriticalEventMarks
              key={battery}
              battery={battery}
              color={getBatteryColor(index)}
              events={eventsByBattery[battery] ?? []}
              x={(event) => xScale(event.timestamp) ?? 0}
              y={(event) => yScale(roundMetricValue(event.value, metric))}
              onHover={onHover}
              onLeave={onLeave}
              onClick={onClickMark}
              hovered={hovered}
              selected={selected}
              selectedGroup={selectedGroup}
            />
          ))}
        </PlotArea>

        <AxisLeft
          scale={yScale}
          tickValues={yTicks}
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

export function AlertsChart({ eventsByBattery, metric, from, to }: AlertsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [hovered, setHovered] = useState<HoveredEvent | null>(null);
  const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  const batteries = Object.keys(eventsByBattery);

  const fromTimestamp = new Date(from).getTime();
  const toTimestamp = new Date(to).getTime();

  // Используем переданные от и до, если доступны; иначе — локальный день
  const [firstTimestamp, lastTimestamp] = toTimestamp > fromTimestamp
    ? [fromTimestamp, toTimestamp]
    : getLocalDayRange(fromTimestamp);

  const values = batteries.flatMap((battery) => (eventsByBattery[battery] ?? []).map((event) => event.value));

  const scales = measuredSize
    ? buildChartScales(
        measuredSize.width,
        measuredSize.height,
        firstTimestamp,
        lastTimestamp,
        values,
        METRIC_TICK_MIN_STEP[metric],
      )
    : null;

  const { selected, tooltipRef, tooltipPosition, toggleSelected } = useEventSelection({
    containerSize: measuredSize,
    anchorOf: ({ battery, event }) => {
      if (!scales) return null;

      const group = findMinuteGroup(eventsByBattery[battery] ?? [], event);
      const values = group.map((e) => roundMetricValue(e.value, metric));
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const [yTop, yBottom] = clampSpan(scales.yScale(maxValue), scales.yScale(minValue), MARK_MIN_HEIGHT);

      return {
        left: scales.margin.left + (scales.xScale(event.timestamp) ?? 0),
        top: scales.margin.top + (yTop + yBottom) / 2,
      };
    },
  });

  const showHover = (event: CriticalPoint, battery: string) => setHovered({ battery, event });

  const clearHovered = () => setHovered(null);

  const selectedGroup = selected ? findMinuteGroup(eventsByBattery[selected.battery] ?? [], selected.event) : [];

  if (batteries.length === 0) {
    return null;
  }

  return (
    <div className='chart-body'>
      <div className='chart-row'>
        {/* Разметка одинакова до и после замера: иначе ResizeObserver останется на чужом узле */}
        <div className='chart-plot' ref={containerRef}>
          {measuredSize && scales && (
            <ChartCanvas
              svgRef={svgRef}
              width={measuredSize.width}
              height={measuredSize.height}
              batteries={batteries}
              eventsByBattery={eventsByBattery}
              metric={metric}
              scales={scales}
              firstTimestamp={firstTimestamp}
              lastTimestamp={lastTimestamp}
              now={now}
              hovered={hovered}
              selected={selected}
              selectedGroup={selectedGroup}
              onHover={showHover}
              onLeave={clearHovered}
              onClickMark={toggleSelected}
            />
          )}

          {selected && tooltipPosition && (
            <ChartTooltip
              ref={tooltipRef}
              left={tooltipPosition.left}
              top={tooltipPosition.top}
              side={tooltipPosition.side}
              arrowTop={tooltipPosition.arrowTop}
              battery={selected.battery}
              color={getBatteryColor(batteries.indexOf(selected.battery))}
              timestamp={selected.event.timestamp}
              min={Math.min(...selectedGroup.map((e) => e.value))}
              max={Math.max(...selectedGroup.map((e) => e.value))}
              metric={metric}
              events={eventsByBattery[selected.battery] ?? []}
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
              selected={selected}
              selectedGroup={selectedGroup}
              onHover={showHover}
              onLeave={clearHovered}
              onSelect={toggleSelected}
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

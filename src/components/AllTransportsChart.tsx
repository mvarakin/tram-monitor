import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { scaleLinear, scaleTime } from '@visx/scale';
import { useMemo } from 'react';

import { CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH, INNER_HEIGHT, INNER_WIDTH } from './chartLayout';
import { HISTORY_WINDOW_MS, SPEED_DOMAIN, TEMPERATURE_DOMAIN } from './chartScales';
import { PlotArea } from './PlotArea';
import { buildTonePaths, createSpeedSegments, createTemperatureSegments } from './segments';
import { SPEED_DANGER, SPEED_WARNING, TEMPERATURE_DANGER, TONE_COLOR } from './thresholds';

import type { Metric } from './ChartPanel';
import type { Tone } from './thresholds';
import type { Transport } from '../types/transport';

type AllTransportsChartProps = {
  transports: Transport[];
  metric: Metric;
};

/*
 * Линии сотни транспортов ложатся друг на друга,
 * поэтому они тоньше и прозрачнее, чем на графике
 * одного транспорта: видно плотность, а не только
 * верхнюю линию.
 */
const LINE_WIDTH = 1;
const LINE_OPACITY = 0.4;

export function AllTransportsChart({ transports, metric }: AllTransportsChartProps) {
  const chart = useMemo(() => {
    const isTemperature = metric === 'temperature';

    /*
     * Все истории обновляются одним тактом опроса,
     * поэтому окно берём по первому транспорту.
     */
    const firstHistory = isTemperature ? transports[0]?.history : transports[0]?.speedHistory;

    const lastPoint = firstHistory?.[firstHistory.length - 1];

    if (!lastPoint) {
      return null;
    }

    const xScale = scaleTime<number>({
      domain: [lastPoint.timestamp - HISTORY_WINDOW_MS, lastPoint.timestamp],
      range: [0, INNER_WIDTH],
    });

    const yScale = scaleLinear<number>({
      domain: isTemperature ? TEMPERATURE_DOMAIN : SPEED_DOMAIN,
      range: [INNER_HEIGHT, 0],
    });

    const x = (point: { timestamp: number }) => xScale(point.timestamp) ?? 0;

    const paths = isTemperature
      ? transports.flatMap((transport) =>
          buildTonePaths(createTemperatureSegments(transport.history), x, (point) =>
            yScale(point.temperature),
          ).map((path) => ({ ...path, id: `${transport.id}-${path.tone}` })),
        )
      : transports.flatMap((transport) =>
          buildTonePaths(createSpeedSegments(transport.speedHistory), x, (point) =>
            yScale(point.speed),
          ).map((path) => ({ ...path, id: `${transport.id}-${path.tone}` })),
        );

    const thresholds: { tone: Tone; value: number }[] = isTemperature
      ? [{ tone: 'danger', value: TEMPERATURE_DANGER }]
      : [
          { tone: 'warning', value: SPEED_WARNING },
          { tone: 'danger', value: SPEED_DANGER },
        ];

    return { xScale, yScale, paths, thresholds };
  }, [transports, metric]);

  if (!chart) {
    return null;
  }

  const { xScale, yScale, paths, thresholds } = chart;

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      width='100%'
      preserveAspectRatio='xMidYMid meet'
      style={{ maxWidth: CHART_WIDTH, display: 'block' }}>
      <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
        <PlotArea>
          {/* Линии транспортов: не более двух путей на транспорт */}

          {paths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              stroke={TONE_COLOR[path.tone]}
              strokeWidth={LINE_WIDTH}
              strokeOpacity={LINE_OPACITY}
              fill='none'
            />
          ))}

          {/* Пороги — поверх линий и без прозрачности */}

          {thresholds.map((threshold) => (
            <line
              key={threshold.tone}
              x1={0}
              x2={INNER_WIDTH}
              y1={yScale(threshold.value)}
              y2={yScale(threshold.value)}
              stroke={TONE_COLOR[threshold.tone]}
              strokeDasharray='6 4'
              strokeWidth={1}
            />
          ))}
        </PlotArea>

        <AxisLeft
          scale={yScale}
          numTicks={metric === 'temperature' ? 10 : 7}
          tickFormat={(value) => (metric === 'temperature' ? `${value}°` : `${value}`)}
        />

        <AxisBottom
          top={INNER_HEIGHT}
          scale={xScale}
          numTicks={7}
          tickFormat={(value) =>
            new Date(Number(value)).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
          }
        />
      </Group>
    </svg>
  );
}

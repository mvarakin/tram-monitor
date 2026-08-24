import { scaleLinear, scaleTime } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';

import { CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH, INNER_HEIGHT, INNER_WIDTH } from './chartLayout';
import { HISTORY_WINDOW_MS, TEMPERATURE_DOMAIN } from './chartScales';
import { PlotArea } from './PlotArea';
import { getTemperatureTone, TEMPERATURE_DANGER, TONE_COLOR } from './thresholds';

import type { TemperaturePoint } from '../types/temperature';

type TemperatureHistogramProps = {
  data: TemperaturePoint[];
};

export function TemperatureHistogram({ data }: TemperatureHistogramProps) {
  if (data.length === 0) {
    return null;
  }

  const lastTimestamp = data[data.length - 1].timestamp;

  const firstTimestamp = lastTimestamp - HISTORY_WINDOW_MS;

  const xScale = scaleTime<number>({
    domain: [firstTimestamp, lastTimestamp],
    range: [0, INNER_WIDTH],
  });

  const yScale = scaleLinear<number>({
    domain: TEMPERATURE_DOMAIN,
    range: [INNER_HEIGHT, 0],
  });

  const barWidth = Math.max(1, INNER_WIDTH / (data.length + 1));

  const lastPoint = data[data.length - 1];

  const lastX = xScale(lastPoint.timestamp) ?? 0;

  const lastY = yScale(lastPoint.temperature);

  const lastColor = TONE_COLOR[getTemperatureTone(lastPoint.temperature)];

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      width='100%'
      preserveAspectRatio='xMidYMid meet'
      style={{ maxWidth: CHART_WIDTH, display: 'block' }}>
      <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
        <PlotArea>
          {/* Порог 80 °C */}

          <line
            x1={0}
            x2={INNER_WIDTH}
            y1={yScale(TEMPERATURE_DANGER)}
            y2={yScale(TEMPERATURE_DANGER)}
            stroke={TONE_COLOR.danger}
            strokeDasharray='6 4'
            strokeWidth={1}
          />

          {/* Столбцы */}

          {data.map((point) => {
            const x = xScale(point.timestamp) ?? 0;

            const y = yScale(point.temperature);

            const height = INNER_HEIGHT - y;

            const color = TONE_COLOR[getTemperatureTone(point.temperature)];

            return (
              <Bar
                key={point.timestamp}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={height}
                fill={color}
                opacity={0.75}
              />
            );
          })}
        </PlotArea>

        {/* Последняя точка */}

        <circle cx={lastX} cy={lastY} r={5} fill={lastColor} />

        {/* Значение последней точки */}

        <text
          x={lastX + 12}
          y={lastY + 5}
          textAnchor='start'
          fontSize={14}
          fontWeight='bold'
          fill={lastColor}>
          {lastPoint.temperature.toFixed(1)} °C
        </text>

        {/* Ось Y */}

        <AxisLeft scale={yScale} numTicks={10} tickFormat={(value) => `${value}°`} />

        {/* Ось X */}

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

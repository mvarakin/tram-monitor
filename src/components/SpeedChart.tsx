import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveLinear } from '@visx/curve';
import { Group } from '@visx/group';
import { scaleLinear, scaleTime } from '@visx/scale';
import { LinePath } from '@visx/shape';

import { CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH, INNER_HEIGHT, INNER_WIDTH } from './chartLayout';
import { HISTORY_WINDOW_MS, SPEED_DOMAIN } from './chartScales';
import { PlotArea } from './PlotArea';
import { createSpeedSegments } from './segments';
import { getSpeedTone, SPEED_DANGER, SPEED_WARNING, TONE_COLOR } from './thresholds';

import type { SpeedPoint } from '../types/speed';

type SpeedChartProps = {
  data: SpeedPoint[];
};

export function SpeedChart({ data }: SpeedChartProps) {
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
    domain: SPEED_DOMAIN,
    range: [INNER_HEIGHT, 0],
  });

  const segments = createSpeedSegments(data);

  const lastPoint = data[data.length - 1];

  const lastX = xScale(lastPoint.timestamp) ?? 0;

  const lastY = yScale(lastPoint.speed);

  const lastColor = TONE_COLOR[getSpeedTone(lastPoint.speed)];

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      width='100%'
      preserveAspectRatio='xMidYMid meet'
      style={{ maxWidth: CHART_WIDTH, display: 'block' }}>
      <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
        <PlotArea>
          {/* Порог 60 км/ч */}

          <line
            x1={0}
            x2={INNER_WIDTH}
            y1={yScale(SPEED_WARNING)}
            y2={yScale(SPEED_WARNING)}
            stroke={TONE_COLOR.warning}
            strokeDasharray='6 4'
            strokeWidth={1}
          />

          {/* Порог 80 км/ч */}

          <line
            x1={0}
            x2={INNER_WIDTH}
            y1={yScale(SPEED_DANGER)}
            y2={yScale(SPEED_DANGER)}
            stroke={TONE_COLOR.danger}
            strokeDasharray='6 4'
            strokeWidth={1}
          />

          {/* Линия скорости по сегментам */}

          {segments.map((segment, index) => (
            <LinePath<SpeedPoint>
              key={index}
              data={segment.points}
              x={(point) => xScale(point.timestamp) ?? 0}
              y={(point) => yScale(point.speed)}
              curve={curveLinear}
              stroke={TONE_COLOR[segment.tone]}
              strokeWidth={3}
              fill='none'
            />
          ))}
        </PlotArea>

        {/* Последняя точка */}

        <circle cx={lastX} cy={lastY} r={5} fill={lastColor} />

        {/* Текущее значение */}

        <text
          x={lastX + 12}
          y={lastY + 5}
          textAnchor='start'
          fontSize={14}
          fontWeight='bold'
          fill={lastColor}>
          {lastPoint.speed.toFixed(1)} км/ч
        </text>

        <AxisLeft scale={yScale} numTicks={7} tickFormat={(value) => `${value}`} />

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

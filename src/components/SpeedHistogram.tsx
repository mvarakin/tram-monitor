import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { scaleLinear, scaleTime } from '@visx/scale';
import { Bar } from '@visx/shape';

import { CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH, INNER_HEIGHT, INNER_WIDTH } from './chartLayout';
import { HISTORY_WINDOW_MS, SPEED_DOMAIN } from './chartScales';
import { PlotArea } from './PlotArea';
import { getSpeedTone, TONE_COLOR } from './thresholds';

import type { SpeedPoint } from '../types/speed';

type SpeedHistogramProps = {
  data: SpeedPoint[];
};

export function SpeedHistogram({ data }: SpeedHistogramProps) {
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

  const barWidth = Math.max(1, INNER_WIDTH / (data.length + 1));

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      width='100%'
      preserveAspectRatio='xMidYMid meet'
      style={{ maxWidth: CHART_WIDTH, display: 'block' }}>
      <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
        <PlotArea>
          {data.map((point) => {
            const x = xScale(point.timestamp) ?? 0;

            const y = yScale(point.speed);

            const height = INNER_HEIGHT - y;

            return (
              <Bar
                key={point.timestamp}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={height}
                fill={TONE_COLOR[getSpeedTone(point.speed)]}
                opacity={0.8}
              />
            );
          })}
        </PlotArea>

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

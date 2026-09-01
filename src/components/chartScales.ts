import { scaleLinear, scaleTime } from '@visx/scale';

import { buildChartLayout } from './chartLayout';
import { buildValueTicks } from './valueTicks';

export type ChartScales = ReturnType<typeof buildChartScales>;

/** Общие для графика и внешних кликов (панель событий) шкалы — считаются один раз в родителе. */
export function buildChartScales(
  width: number,
  height: number,
  firstTimestamp: number,
  lastTimestamp: number,
  values: number[],
  tickMinStep: number,
) {
  const { margin, innerWidth, innerHeight } = buildChartLayout(width, height);

  const yTicks = buildValueTicks(Math.min(...values), Math.max(...values), 8, tickMinStep);

  const xScale = scaleTime<number>({
    domain: [firstTimestamp, lastTimestamp],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear<number>({
    domain: [yTicks[0], yTicks[yTicks.length - 1]],
    range: [innerHeight, 0],
  });

  return { margin, innerWidth, innerHeight, xScale, yScale, yTicks };
}

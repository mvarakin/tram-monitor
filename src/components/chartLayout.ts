import { CHART_MARGIN } from '../constants';

export type ChartLayout = {
  width: number;
  height: number;
  margin: typeof CHART_MARGIN;
  innerWidth: number;
  innerHeight: number;
};

export function buildChartLayout(width: number, height: number): ChartLayout {
  const margin = CHART_MARGIN;

  return {
    width,
    height,
    margin,
    innerWidth: width - margin.left - margin.right,
    innerHeight: height - margin.top - margin.bottom,
  };
}

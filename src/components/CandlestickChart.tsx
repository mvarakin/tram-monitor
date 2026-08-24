import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveLinear } from '@visx/curve';
import { Group } from '@visx/group';
import { scaleLinear, scaleTime } from '@visx/scale';
import { LinePath } from '@visx/shape';

import { getBatteryColor } from './batteryColors';
import { BatteryLegend } from './BatteryLegend';
import { CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH, INNER_HEIGHT, INNER_WIDTH } from './chartLayout';
import { PlotArea } from './PlotArea';
import { TEMPERATURE_DANGER, VOLTAGE_DANGER } from './thresholds';

import type { Candle } from '../data/tramSelectors';
import type { Metric } from '../types/metric';

type CandlestickChartProps = {
  candlesByBattery: Record<string, Candle[]>;
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

export function CandlestickChart({ candlesByBattery, metric, from, to }: CandlestickChartProps) {
  const batteries = Object.keys(candlesByBattery);

  if (batteries.length === 0) {
    return null;
  }

  const danger = metric === 'temperature' ? TEMPERATURE_DANGER : VOLTAGE_DANGER;

  const unit = metric === 'temperature' ? '°C' : 'В';

  const firstTimestamp = new Date(from).getTime();

  const lastTimestamp = new Date(to).getTime();

  const allCandles = batteries.flatMap((battery) => candlesByBattery[battery]);

  const dataMin = Math.min(...allCandles.map((candle) => candle.low));

  const dataMax = Math.max(...allCandles.map((candle) => candle.high));

  const domainMin = Math.min(dataMin, danger);

  const domainMax = Math.max(dataMax, danger);

  const padding = (domainMax - domainMin) * 0.1 || 1;

  const xScale = scaleTime<number>({
    domain: [firstTimestamp, lastTimestamp],
    range: [0, INNER_WIDTH],
  });

  const yScale = scaleLinear<number>({
    domain: [domainMin - padding, domainMax + padding],
    range: [INNER_HEIGHT, 0],
  });

  return (
    <>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width='100%'
        preserveAspectRatio='xMidYMid meet'
        style={{ maxWidth: CHART_WIDTH, display: 'block' }}>
        <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
          <PlotArea>
            {/* Линия порога */}

            <line
              x1={0}
              x2={INNER_WIDTH}
              y1={yScale(danger)}
              y2={yScale(danger)}
              stroke='red'
              strokeDasharray='6 4'
              strokeWidth={1}
            />

            {batteries.map((battery, index) => {
              const color = getBatteryColor(index);

              const candles = candlesByBattery[battery];

              return (
                <g key={battery}>
                  {/* Фитили — только там, где critical раздвинул high/low */}

                  {candles
                    .filter((candle) => candle.high > candle.low)
                    .map((candle) => (
                      <line
                        key={candle.timestamp}
                        x1={xScale(candle.timestamp) ?? 0}
                        x2={xScale(candle.timestamp) ?? 0}
                        y1={yScale(candle.low)}
                        y2={yScale(candle.high)}
                        stroke={color}
                        strokeWidth={2}
                      />
                    ))}

                  {/* Тело свечи: open === close, поэтому линия по close */}

                  <LinePath<Candle>
                    data={candles}
                    x={(candle) => xScale(candle.timestamp) ?? 0}
                    y={(candle) => yScale(candle.close)}
                    curve={curveLinear}
                    stroke={color}
                    strokeWidth={1.5}
                    fill='none'
                  />
                </g>
              );
            })}
          </PlotArea>

          <AxisLeft scale={yScale} numTicks={8} tickFormat={(value) => `${value}${unit}`} />

          <AxisBottom
            top={INNER_HEIGHT}
            scale={xScale}
            numTicks={8}
            tickFormat={(value) => formatTick(Number(value))}
          />
        </Group>
      </svg>

      <BatteryLegend
        items={batteries.map((battery, index) => ({
          label: battery,
          color: getBatteryColor(index),
        }))}
      />
    </>
  );
}

import { useMemo } from 'react';

import { AllTransportsChart } from './AllTransportsChart';
import { averageSpeedHistory, averageTemperatureHistory } from './averages';
import { ChartDescription } from './ChartDescription';
import { ChartLegend } from './ChartLegend';
import { SPEED_LEGEND, TEMPERATURE_LEGEND } from './chartLegends';
import { ChartTabs } from './ChartTabs';
import { SpeedChart } from './SpeedChart';
import { TemperatureChart } from './TemperatureChart';

import type { Metric } from './ChartPanel';
import type { Transport } from '../types/transport';

type OverviewPanelProps = {
  transports: Transport[];
  metric: Metric;
};

const MEASUREMENT_NOTE = 'Измерение каждые 10 секунд.';

export function OverviewPanel({ transports, metric }: OverviewPanelProps) {
  const isTemperature = metric === 'temperature';

  const averageTemperature = useMemo(() => averageTemperatureHistory(transports), [transports]);

  const averageSpeed = useMemo(() => averageSpeedHistory(transports), [transports]);

  const average = isTemperature ? averageTemperature : averageSpeed;

  const updatedAt = average[average.length - 1]?.timestamp;

  return (
    <aside className='chart-panel'>
      <div className='chart-panel__header'>
        <h2 className='chart-panel__title'>Общие данные</h2>
      </div>

      <ChartTabs transport={null} metric={metric} />

      <div className='chart-panel__content'>
        <ChartDescription
          title={isTemperature ? 'Температура всех транспортов' : 'Скорость всех транспортов'}
          description={`Все транспорты за последние 60 минут. ${MEASUREMENT_NOTE}`}
          updatedAt={updatedAt}
        />

        <section className='chart-section'>
          <AllTransportsChart transports={transports} metric={metric} />

          <div className='chart-footer'>
            <ChartLegend items={isTemperature ? TEMPERATURE_LEGEND : SPEED_LEGEND} />
          </div>
        </section>

        <ChartDescription
          title={isTemperature ? 'Средняя температура' : 'Средняя скорость'}
          description={`Среднее по всем транспортам за последние 60 минут. ${MEASUREMENT_NOTE}`}
          updatedAt={updatedAt}
        />

        <section className='chart-section'>
          {isTemperature ? (
            <TemperatureChart data={averageTemperature} />
          ) : (
            <SpeedChart data={averageSpeed} />
          )}

          <div className='chart-footer'>
            <ChartLegend items={isTemperature ? TEMPERATURE_LEGEND : SPEED_LEGEND} />
          </div>
        </section>
      </div>
    </aside>
  );
}

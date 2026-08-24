import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ChartDescription } from './ChartDescription';
import { ChartLegend } from './ChartLegend';
import { SPEED_LEGEND, TEMPERATURE_LEGEND } from './chartLegends';
import { ChartTabs } from './ChartTabs';
import { InfoItem } from './InfoItem';
import { SpeedChart } from './SpeedChart';
import { SpeedHistogram } from './SpeedHistogram';
import { TemperatureChart } from './TemperatureChart';
import { TemperatureHistogram } from './TemperatureHistogram';
import {
  getSpeedTone,
  getTemperatureTone,
  SPEED_STATUS,
  TEMPERATURE_STATUS,
} from './thresholds';

import type { Transport } from '../types/transport';

export type Metric = 'temperature' | 'speed';

type ChartType = 'line' | 'histogram';

type ChartPanelProps = {
  transport: Transport | null;
  metric: Metric;
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function ChartPanel({ transport, metric }: ChartPanelProps) {
  /*
   * Тип графика живёт здесь, поэтому переживает
   * и смену транспорта, и смену метрики.
   */
  const [chartType, setChartType] = useState<ChartType>('line');

  if (!transport) {
    return <aside className='chart-panel chart-panel--empty'>Транспорт не найден</aside>;
  }

  const tone =
    metric === 'speed' ? getSpeedTone(transport.speed) : getTemperatureTone(transport.temperature);

  const info =
    metric === 'speed'
      ? {
          label: 'Текущая скорость',
          value: `${transport.speed.toFixed(1)} км/ч`,
          status: SPEED_STATUS[tone],
        }
      : {
          label: 'Текущая температура',
          value: `${transport.temperature.toFixed(1)} °C`,
          status: TEMPERATURE_STATUS[tone],
        };

  const lastPoint =
    metric === 'temperature'
      ? transport.history[transport.history.length - 1]
      : transport.speedHistory[transport.speedHistory.length - 1];

  const lastMeasurement = lastPoint ? formatTime(lastPoint.timestamp) : '—';

  return (
    <aside className='chart-panel'>
      <div className='chart-panel__header'>
        <h2 className='chart-panel__title'>{transport.name}</h2>

        <Link
          to={metric === 'speed' ? '/speed' : '/temperature'}
          className='chart-panel__close'
          aria-label='Закрыть панель'>
          <span aria-hidden='true'>✕</span>
        </Link>
      </div>

      <ChartTabs transport={transport} metric={metric} />

      <div className='chart-panel__content'>
        <section className='transport-info'>
          <InfoItem label={info.label} value={info.value} tone={tone} />

          <InfoItem label='Статус' value={info.status} tone={tone} variant='status' />

          <InfoItem label='Последнее измерение' value={lastMeasurement} />
        </section>

        <ChartDescription
          title={metric === 'temperature' ? 'Изменение температуры' : 'Изменение скорости'}
          description={
            metric === 'temperature'
              ? 'История температуры за последние 60 минут. Измерение каждые 10 секунд.'
              : 'История скорости за последние 60 минут. Измерение каждые 10 секунд.'
          }
          updatedAt={lastPoint?.timestamp}
        />

        <section className='chart-section'>
          {metric === 'temperature' ? (
            chartType === 'line' ? (
              <TemperatureChart data={transport.history} />
            ) : (
              <TemperatureHistogram data={transport.history} />
            )
          ) : chartType === 'line' ? (
            <SpeedChart data={transport.speedHistory} />
          ) : (
            <SpeedHistogram data={transport.speedHistory} />
          )}

          <div className='chart-footer'>
            <ChartLegend items={metric === 'speed' ? SPEED_LEGEND : TEMPERATURE_LEGEND} />

            <div className='chart-switcher'>
              <button
                type='button'
                className={
                  chartType === 'line' ? 'chart-button chart-button--active' : 'chart-button'
                }
                onClick={() => setChartType('line')}>
                График
              </button>

              <button
                type='button'
                className={
                  chartType === 'histogram' ? 'chart-button chart-button--active' : 'chart-button'
                }
                onClick={() => setChartType('histogram')}>
                Гистограмма
              </button>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}

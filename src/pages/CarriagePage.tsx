import { Link, useParams } from 'react-router-dom';

import { BatteryChart } from '../components/BatteryChart';
import { buildBatterySegments, buildCriticalEvents } from '../data/carriageSelectors';
import { METRIC_LABEL } from '../constants';
import { formatPeriod } from './formatPeriod';

import type { EdcStatistic } from '../types/edcStatistic';
import type { Metric } from '../types/metric';

type CarriagePageProps = {
  edc: EdcStatistic;
  metric: Metric;
};

export function CarriagePage({ edc, metric }: CarriagePageProps) {
  const { number } = useParams();

  const carriage = edc.carriages.find((item) => item.number === number);

  if (!carriage) {
    return (
      <main className='app'>
        <p>Вагон не найден.</p>
        <Link to='/' style={{ textTransform: 'none', borderBottom: '1px solid #1a73e8' }}>Назад</Link>
      </main>
    );
  }

  const segmentsByBattery = buildBatterySegments(carriage, metric);

  const eventsByBattery = buildCriticalEvents(carriage, metric);

  const hasData = Object.keys(segmentsByBattery).length > 0 || Object.keys(eventsByBattery).length > 0;

  return (
    <main className='app carriage-page'>
      <div className='chart-panel__header'>
        <Link to='/' className='chart-panel__back'>← Назад</Link>

        <div>
          <h1 className='chart-panel__title'>
            Вагон {carriage.number} ({carriage.type}) — {METRIC_LABEL[metric]}
          </h1>

          <p className='chart-panel__period'>{formatPeriod(edc.from, edc.to)}</p>
        </div>
      </div>

      <section className='chart-section'>
        {hasData ? (
          <BatteryChart
            segmentsByBattery={segmentsByBattery}
            eventsByBattery={eventsByBattery}
            metric={metric}
            from={edc.from}
            to={edc.to}
          />
        ) : (
          <p>Нет данных за период.</p>
        )}
      </section>
    </main>
  );
}

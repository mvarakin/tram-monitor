import { Link, useParams } from 'react-router-dom';

import { BatteryChart } from '../components/BatteryChart';
import { buildBatterySegments, buildCriticalEvents } from '../data/carriageSelectors';

import type { EdcStatistic } from '../types/edcStatistic';
import type { Metric } from '../types/metric';

type CarriagePageProps = {
  edc: EdcStatistic;
  metric: Metric;
};

const METRIC_LABEL: Record<Metric, string> = {
  temperature: 'Температура',
  voltage: 'Напряжение',
};

export function CarriagePage({ edc, metric }: CarriagePageProps) {
  const { number } = useParams();

  const carriage = edc.carriages.find((item) => item.number === number);

  if (!carriage) {
    return (
      <main className='app'>
        <p>Вагон не найден.</p>
        <Link to='/'>Назад</Link>
      </main>
    );
  }

  const segmentsByBattery = buildBatterySegments(carriage, metric);

  const eventsByBattery = buildCriticalEvents(carriage, metric);

  const hasData = Object.keys(segmentsByBattery).length > 0 || Object.keys(eventsByBattery).length > 0;

  return (
    <main className='app'>
      <div className='chart-panel__header'>
        <h1 className='chart-panel__title'>
          Вагон {carriage.number} — {METRIC_LABEL[metric]}
        </h1>

        <Link to='/'>Назад</Link>
      </div>

      <section className='chart-section'>
        <h2>
          Вагон {carriage.number} ({carriage.type})
        </h2>

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

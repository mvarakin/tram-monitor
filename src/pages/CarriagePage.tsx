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

const PERIOD_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/** Границы периода в локальной зоне — как и подписи оси времени на графике. */
function formatPeriod(from: string, to: string): string {
  const start = new Date(from).toLocaleString('ru-RU', PERIOD_FORMAT);

  const end = new Date(to).toLocaleString('ru-RU', PERIOD_FORMAT);

  return `${start} — ${end}`;
}

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
        <div>
          <h1 className='chart-panel__title'>
            Вагон {carriage.number} — {METRIC_LABEL[metric]}
          </h1>

          <p className='chart-panel__period'>{formatPeriod(edc.from, edc.to)}</p>
        </div>

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

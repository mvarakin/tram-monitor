import { Link, useParams } from 'react-router-dom';

import { AlertsChart } from '../components/AlertsChart';
import { getCarriageAlertData } from '../data/alertSelectors';
import { METRIC_LABEL } from '../constants';
import { formatPeriod } from './formatPeriod';
import { getLocalDayRange } from '../time';

import type { Alert } from '../types/alert';
import type { Metric } from '../types/metric';

type CarriageAlertsPageProps = {
  alerts: Alert[];
  metric: Metric;
};

export function CarriageAlertsPage({ alerts, metric }: CarriageAlertsPageProps) {
  const { number } = useParams();

  const data = number ? getCarriageAlertData(alerts, number, metric) : null;

  if (!data) {
    return (
      <main className='app'>
        <p>Вагон не найден.</p>
        <Link to='/' style={{ textTransform: 'none', borderBottom: '1px solid #1a73e8' }}>Назад</Link>
      </main>
    );
  }

  const { carriageType, eventsByBattery } = data;

  const hasData = Object.keys(eventsByBattery).length > 0;

  const [from, to] = getLocalDayRange(Date.now()).map((ms) => new Date(ms).toISOString()) as [string, string];

  return (
    <main className='app carriage-page'>
      <div className='chart-panel__header'>
        <Link to='/' className='chart-panel__back'>← Назад</Link>

        <div>
          <h1 className='chart-panel__title'>
            Вагон {number} ({carriageType}) — {METRIC_LABEL[metric]}
          </h1>

          <p className='chart-panel__period'>{formatPeriod(from, to)}</p>
        </div>
      </div>

      <section className='chart-section'>
        {hasData ? (
          <AlertsChart
            eventsByBattery={eventsByBattery}
            metric={metric}
            from={from}
            to={to}
          />
        ) : (
          <p>Алертов за период нет.</p>
        )}
      </section>
    </main>
  );
}

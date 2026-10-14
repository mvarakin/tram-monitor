import { Link, useOutletContext, useParams } from 'react-router-dom';

import { AlertsChart } from '../components/AlertsChart';
import { METRIC_LABEL } from '../constants';
import { getCarriageAlertData } from '../data/alertSelectors';
import { getLocalDayRange } from '../time';
import { formatDate } from './formatDate';

import type { Metric } from '../types/metric';
import type { OutletContextType } from '../types/outletContext';

type CarriageAlertsPageProps = {
  metric: Metric;
};

export function CarriageAlertsPage({ metric }: CarriageAlertsPageProps) {
  const { alerts, isLoadingAlerts } = useOutletContext<OutletContextType>();
  const { number } = useParams();

  if (isLoadingAlerts) {
    return (
      <main className='app'>
        <p>Загрузка…</p>
      </main>
    );
  }

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
            Вагон {number} ({carriageType}) — {METRIC_LABEL[metric]}: критические события
          </h1>

          <p className='chart-panel__period'>{formatDate(from)}</p>
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
          <p>Критических событий за период нет.</p>
        )}
      </section>
    </main>
  );
}

import { Link, useParams } from 'react-router-dom';

import { CandlestickChart } from '../components/CandlestickChart';
import { buildBatteryCandles, TRAM_NAME } from '../data/tramSelectors';

import type { EdcStatistic } from '../types/edcStatistic';
import type { Metric } from '../types/metric';

type TramPageProps = {
  edc: EdcStatistic;
  metric: Metric;
};

const METRIC_LABEL: Record<Metric, string> = {
  temperature: 'Температура',
  voltage: 'Напряжение',
};

export function TramPage({ edc, metric }: TramPageProps) {
  const { id } = useParams();

  if (id !== '1') {
    return (
      <main className='app'>
        <p>Трамвай не найден.</p>
        <Link to='/'>Назад</Link>
      </main>
    );
  }

  return (
    <main className='app'>
      <div className='chart-panel__header'>
        <h1 className='chart-panel__title'>
          {TRAM_NAME} — {METRIC_LABEL[metric]}
        </h1>

        <Link to='/'>Назад</Link>
      </div>

      {edc.carriages.map((carriage) => (
        <section key={carriage.number} className='chart-section'>
          <h2>
            Вагон {carriage.number} ({carriage.type})
          </h2>

          <CandlestickChart
            candlesByBattery={buildBatteryCandles(carriage, metric)}
            metric={metric}
            from={edc.from}
            to={edc.to}
          />
        </section>
      ))}
    </main>
  );
}

import { useMemo } from 'react';

import { MetricTable } from '../components/MetricTable';
import { getCarriageRows } from '../data/carriageSelectors';

import type { EdcStatistic } from '../types/edcStatistic';

type HomePageProps = {
  edc: EdcStatistic;
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

export function HomePage({ edc }: HomePageProps) {
  const temperatureRows = useMemo(() => getCarriageRows(edc, 'temperature'), [edc]);

  const voltageRows = useMemo(() => getCarriageRows(edc, 'voltage'), [edc]);

  return (
    <main className='app'>
      <h1>Мониторинг за период: {formatPeriod(edc.from, edc.to)}</h1>

      <div className='split'>
        <MetricTable title='Температура' metric='temperature' unit='°C' rows={temperatureRows} />

        <MetricTable title='Напряжение' metric='voltage' unit='В' rows={voltageRows} />
      </div>
    </main>
  );
}

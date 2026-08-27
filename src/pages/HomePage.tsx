import { useMemo } from 'react';

import { MetricTable } from '../components/MetricTable';
import { getCarriageRows } from '../data/carriageSelectors';
import { formatPeriod } from './formatPeriod';

import type { EdcStatistic } from '../types/edcStatistic';

type HomePageProps = {
  edc: EdcStatistic;
};

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

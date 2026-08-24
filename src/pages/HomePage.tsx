import { MetricTable } from '../components/MetricTable';
import { getTramRows } from '../data/tramSelectors';

import type { EdcStatistic } from '../types/edcStatistic';

type HomePageProps = {
  edc: EdcStatistic;
};

export function HomePage({ edc }: HomePageProps) {
  return (
    <main className='app'>
      <h1>Мониторинг трамваев</h1>

      <div className='split'>
        <MetricTable
          title='Температура'
          metric='temperature'
          unit='°C'
          rows={getTramRows(edc, 'temperature')}
        />

        <MetricTable
          title='Напряжение'
          metric='voltage'
          unit='В'
          rows={getTramRows(edc, 'voltage')}
        />
      </div>
    </main>
  );
}

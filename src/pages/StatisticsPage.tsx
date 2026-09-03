import { useMemo } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';

import { MetricTable } from '../components/MetricTable';
import { getCarriageRows } from '../data/carriageSelectors';
import { formatDate } from './formatDate';
import { toLocalDateInputValue } from '../time';

import type { EdcStatistic } from '../types/edcStatistic';

type OutletContextType = {
  edcStatistic: EdcStatistic;
  isLoadingReal: boolean;
};

export function StatisticsPage() {
  const { edcStatistic, isLoadingReal } = useOutletContext<OutletContextType>();
  const [searchParams, setSearchParams] = useSearchParams();

  const temperatureRows = useMemo(() => getCarriageRows(edcStatistic, 'temperature'), [edcStatistic]);

  const voltageRows = useMemo(() => getCarriageRows(edcStatistic, 'voltage'), [edcStatistic]);

  function handleDateChange(value: string) {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set('date', value);
    } else {
      next.delete('date');
    }

    setSearchParams(next);
  }

  return (
    <main className='app'>
      <h1 className='statistics-page__title'>
        Статистика за {formatDate(edcStatistic.from)}

        <input
          type='date'
          className='statistics-page__date-picker'
          value={toLocalDateInputValue(new Date(edcStatistic.from).getTime())}
          max={toLocalDateInputValue(Date.now())}
          onChange={(event) => handleDateChange(event.target.value)}
          aria-label='Выбрать дату'
        />
      </h1>

      {isLoadingReal ? (
        <p>Загрузка...</p>
      ) : (
        <div className='split'>
          <MetricTable title='Температура' metric='temperature' unit='°C' rows={temperatureRows} />

          <MetricTable title='Напряжение' metric='voltage' unit='В' rows={voltageRows} />
        </div>
      )}
    </main>
  );
}

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { MetricTable } from '../components/MetricTable';
import { getCarriageRows } from '../data/carriageSelectors';
import { formatDate } from './formatDate';
import { toLocalDateInputValue } from '../time';

import type { DataMode } from '../types/dataMode';
import type { EdcStatistic } from '../types/edcStatistic';

type StatisticsPageProps = {
  edc: EdcStatistic;
  dataMode: DataMode;
  onDataModeChange: (mode: DataMode) => void;
  isLoadingReal: boolean;
};

export function StatisticsPage({ edc, dataMode, onDataModeChange, isLoadingReal }: StatisticsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const temperatureRows = useMemo(() => getCarriageRows(edc, 'temperature'), [edc]);

  const voltageRows = useMemo(() => getCarriageRows(edc, 'voltage'), [edc]);

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
      <div className='data-mode-switch'>
        <button
          type='button'
          className={`data-mode-switch__button${dataMode === 'real' ? ' data-mode-switch__button--active' : ''}`}
          disabled={isLoadingReal}
          onClick={() => onDataModeChange('real')}>
          Реальные данные
        </button>

        <button
          type='button'
          className={`data-mode-switch__button${dataMode === 'fake' ? ' data-mode-switch__button--active' : ''}`}
          disabled={isLoadingReal}
          onClick={() => onDataModeChange('fake')}>
          Фейк
        </button>
      </div>

      <h1 className='statistics-page__title'>
        Статистика за {formatDate(edc.from)}

        <input
          type='date'
          className='statistics-page__date-picker'
          value={toLocalDateInputValue(new Date(edc.from).getTime())}
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

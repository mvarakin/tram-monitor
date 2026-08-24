import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  DEFAULT_SORT,
  getNextSort,
  SORTABLE_COLUMNS,
  sortTransports,
  type SortState,
} from './sorting';
import { getSpeedTone, getTemperatureTone } from './thresholds';

import type { Metric } from './ChartPanel';
import type { Transport } from '../types/transport';

type TransportTableProps = {
  transports: Transport[];
  selectedTransportId: number | null;
  metric: Metric;
};

function getAriaSort(sort: SortState, key: SortState['key']) {
  if (sort.key !== key) {
    return 'none';
  }

  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

export function TransportTable({
  transports,
  selectedTransportId,
  metric,
}: TransportTableProps) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const navigate = useNavigate();

  const sortedTransports = useMemo(() => sortTransports(transports, sort), [transports, sort]);

  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  const scrolledSortRef = useRef<string | null>(null);

  /*
   * Подводим список к выбранной строке — при заходе
   * по прямой ссылке она может быть далеко за
   * пределами видимой области, а после смены
   * сортировки уезжает на новое место.
   *
   * Ключ сортировки в рефе не даёт скроллить на
   * каждом обновлении данных.
   */
  useEffect(() => {
    const scrollKey = `${sort.key}:${sort.direction}`;

    if (scrolledSortRef.current === scrollKey || !selectedRowRef.current) {
      return;
    }

    scrolledSortRef.current = scrollKey;

    selectedRowRef.current.scrollIntoView({ block: 'center' });
  }, [sort, selectedTransportId]);

  return (
    <div className='table-container'>
      <table>
        <thead>
          <tr>
            {SORTABLE_COLUMNS.map(({ key, title }) => {
              const isActive = sort.key === key;

              return (
                <th key={key} className='th-sortable' aria-sort={getAriaSort(sort, key)}>
                  <button
                    type='button'
                    className='sort-button'
                    onClick={() => setSort(getNextSort(sort, key))}>
                    {title}

                    <span
                      aria-hidden='true'
                      className={isActive ? 'sort-arrow' : 'sort-arrow sort-arrow--placeholder'}>
                      {isActive && sort.direction === 'desc' ? '▼' : '▲'}
                    </span>
                  </button>
                </th>
              );
            })}

            <th>Последнее измерение</th>
          </tr>
        </thead>

        <tbody>
          {sortedTransports.map((transport) => {
            const isSelected = transport.id === selectedTransportId;

            const temperatureTone = getTemperatureTone(transport.temperature);

            const lastPoint = transport.history[transport.history.length - 1];

            const lastMeasurement = new Date(lastPoint.timestamp).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            /* Смена строки не сбрасывает выбранную вкладку. */
            const to =
              metric === 'speed'
                ? `/transport/${transport.id}/speed`
                : `/transport/${transport.id}`;

            return (
              <tr
                key={transport.id}
                ref={isSelected ? selectedRowRef : null}
                className={isSelected ? 'transport-row transport-row--selected' : 'transport-row'}
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => navigate(to)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                  }

                  /* Пробел иначе проскроллит список. */
                  event.preventDefault();

                  navigate(to);
                }}>
                <td>{transport.name}</td>

                <td
                  className={
                    temperatureTone === 'danger'
                      ? 'temperature-value temperature-value--danger'
                      : 'temperature-value'
                  }>
                  {transport.temperature.toFixed(1)} °C
                </td>

                <td className={`speed-value speed-value--${getSpeedTone(transport.speed)}`}>
                  {transport.speed.toFixed(1)} км/ч
                </td>

                <td>{lastMeasurement}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

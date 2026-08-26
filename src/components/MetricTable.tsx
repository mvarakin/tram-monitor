import { useNavigate } from 'react-router-dom';

import { getTone } from './thresholds';

import type { CarriageRow } from '../data/carriageSelectors';
import type { Metric } from '../types/metric';

type MetricTableProps = {
  title: string;
  metric: Metric;
  unit: string;
  rows: CarriageRow[];
};

export function MetricTable({ title, metric, unit, rows }: MetricTableProps) {
  const navigate = useNavigate();

  return (
    <section>
      <h2>{title}</h2>

      {rows.length === 0 ? (
        <p>Нет данных за период.</p>
      ) : (
        <div className='table-container'>
          <table>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Тип</th>
                <th>Макс, {unit}</th>
                <th>Крит. события</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const tone = getTone(row.max, metric);

                // Номера вида 30641\411 содержат обратный слэш — без кодирования ломают путь.
                const to = `/carriage/${encodeURIComponent(row.number)}/${metric}`;

                return (
                  <tr
                    key={row.number}
                    className='transport-row'
                    tabIndex={0}
                    onClick={() => navigate(to)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') {
                        return;
                      }

                      event.preventDefault();

                      navigate(to);
                    }}>
                    <td>{row.number}</td>

                    <td>{row.type}</td>

                    <td className={`cell--num metric-value metric-value--${tone}`}>
                      {row.max.toFixed(1)}
                    </td>

                    <td className={row.criticalCount > 0 ? 'cell--num metric-value metric-value--danger' : 'cell--num'}>
                      {row.criticalCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

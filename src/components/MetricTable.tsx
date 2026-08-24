import { useNavigate } from 'react-router-dom';

import { getTone } from './thresholds';

import type { TramRow } from '../data/tramSelectors';
import type { Metric } from '../types/metric';

type MetricTableProps = {
  title: string;
  metric: Metric;
  unit: string;
  rows: TramRow[];
};

export function MetricTable({ title, metric, unit, rows }: MetricTableProps) {
  const navigate = useNavigate();

  return (
    <section>
      <h2>{title}</h2>

      <div className='table-container'>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Значение</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const tone = row.value === null ? 'normal' : getTone(row.value, metric);

              const to = `/tram/${row.id}/${metric}`;

              return (
                <tr
                  key={row.id}
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
                  <td>{row.name}</td>

                  <td className={`metric-value metric-value--${tone}`}>
                    {row.value === null ? '—' : `${row.value.toFixed(1)} ${unit}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

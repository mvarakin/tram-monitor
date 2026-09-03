import { useNavigate } from 'react-router-dom';

import { formatAlertMoment } from './formatAlertMoment';
import { formatMetricValue } from './metricFormat';

import type { AlertRow } from '../data/alertSelectors';
import type { Metric } from '../types/metric';

type AlertsTableProps = {
  title: string;
  metric: Metric;
  unit: string;
  rows: AlertRow[];
};

export function AlertsTable({ title, metric, unit, rows }: AlertsTableProps) {
  const navigate = useNavigate();

  return (
    <section>
      <h2>{title}</h2>

      {rows.length === 0 ? (
        <p>Алертов за сегодня нет.</p>
      ) : (
        <div className='table-container'>
          <table>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Тип</th>
                <th>Количество<br />алертов</th>
                <th>Дата<br />последнего алерта</th>
                <th>{title}, {unit}<br />последнего алерта</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
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

                    <td className='cell--num'>{row.count}</td>

                    <td>{formatAlertMoment(row.lastTimestamp)}</td>

                    <td className='cell--num metric-value metric-value--danger'>
                      {formatMetricValue(row.lastValue, metric)}
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

import { useParams } from 'react-router-dom';

import { ChartPanel, type Metric } from '../components/ChartPanel';
import { OverviewPanel } from '../components/OverviewPanel';
import { TransportTable } from '../components/TransportTable';

import type { Transport } from '../types/transport';

type DashboardPageProps = {
  transports: Transport[];
  metric: Metric;
};

export function DashboardPage({ transports, metric }: DashboardPageProps) {
  const { id } = useParams();

  const selectedId = id ? Number(id) : null;

  const transport = transports.find((item) => item.id === selectedId) ?? null;

  return (
    <main className='app'>
      <h1>Мониторинг транспорта</h1>

      <div className='split'>
        <TransportTable
          transports={transports}
          selectedTransportId={selectedId}
          metric={metric}
        />

        {selectedId === null ? (
          <OverviewPanel transports={transports} metric={metric} />
        ) : (
          <ChartPanel transport={transport} metric={metric} />
        )}
      </div>
    </main>
  );
}

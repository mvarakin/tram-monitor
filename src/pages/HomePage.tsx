import { useMemo } from 'react';

import { AlertsTable } from '../components/AlertsTable';
import { PERIOD_FORMAT } from '../constants';
import { getAlertRows } from '../data/alertSelectors';

import type { Alert } from '../types/alert';

type HomePageProps = {
  alerts: Alert[];
};

export function HomePage({ alerts }: HomePageProps) {
  const temperatureRows = useMemo(() => getAlertRows(alerts, 'temperature'), [alerts]);

  const voltageRows = useMemo(() => getAlertRows(alerts, 'voltage'), [alerts]);

  return (
    <main className='app'>
      <h1>Критические события за {new Date().toLocaleDateString('ru-RU', PERIOD_FORMAT)}</h1>

      <div className='split'>
        <AlertsTable title='Температура' metric='temperature' unit='°C' rows={temperatureRows} />

        <AlertsTable title='Напряжение' metric='voltage' unit='В' rows={voltageRows} />
      </div>
    </main>
  );
}

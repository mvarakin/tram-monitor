import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';

import { AlertsTable } from '../components/AlertsTable';
import { PERIOD_FORMAT } from '../constants';
import { getAlertRows } from '../data/alertSelectors';

import type { OutletContextType } from '../types/outletContext';

export function HomePage() {
  const { alerts, isLoadingAlerts } = useOutletContext<OutletContextType>();

  const temperatureRows = useMemo(() => getAlertRows(alerts, 'temperature'), [alerts]);

  const voltageRows = useMemo(() => getAlertRows(alerts, 'voltage'), [alerts]);

  const imbalanceRows = useMemo(() => getAlertRows(alerts, 'imbalance'), [alerts]);

  return (
    <main className='app'>
      <h1>Критические события за {new Date().toLocaleDateString('ru-RU', PERIOD_FORMAT)}</h1>

      {isLoadingAlerts ? (
        <p>Загрузка…</p>
      ) : (
        <div className='split'>
          <AlertsTable title='Температура' metric='temperature' unit='°C' rows={temperatureRows} />

          <AlertsTable title='Напряжение' metric='voltage' unit='В' rows={voltageRows} />

          <AlertsTable title='Разбаланс' metric='imbalance' unit='В' rows={imbalanceRows} />
        </div>
      )}
    </main>
  );
}

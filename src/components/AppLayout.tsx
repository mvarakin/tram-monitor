import { useEffect, useMemo, useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';

import { AppHeader } from './AppHeader';
import { generateEdcStatistic } from '../data/generateEdcStatistic';

import type { EdcStatistic } from '../types/edcStatistic';
import type { DataMode } from '../types/dataMode';

const STATISTICS_DATA_MODE_KEY = 'statisticsDataMode';
const ALERTS_DATA_MODE_KEY = 'alertsDataMode';

function readStoredDataMode(key: string): DataMode {
  return localStorage.getItem(key) === 'real' ? 'real' : 'fake';
}

type OutletContextType = {
  edcStatistic: EdcStatistic;
  isLoadingReal: boolean;
};

export function AppLayout() {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') ?? undefined;

  const [statisticsDataMode, setStatisticsDataMode] = useState<DataMode>(() =>
    readStoredDataMode(STATISTICS_DATA_MODE_KEY)
  );

  const [alertsDataMode, setAlertsDataMode] = useState<DataMode>(() =>
    readStoredDataMode(ALERTS_DATA_MODE_KEY)
  );

  const [isLoadingReal, setIsLoadingReal] = useState(false);

  const fakeEdc = useMemo(() => generateEdcStatistic(date), [date]);

  const [realEdc, setRealEdc] = useState<EdcStatistic | null>(null);

  useEffect(() => {
    localStorage.setItem(STATISTICS_DATA_MODE_KEY, statisticsDataMode);

    if (statisticsDataMode !== 'real' || realEdc) {
      return;
    }

    let cancelled = false;

    setIsLoadingReal(true);

    import('../data/statistics.json').then((module) => {
      if (cancelled) {
        return;
      }

      setRealEdc(module.default);

      setIsLoadingReal(false);
    });

    return () => {
      cancelled = true;
    };
  }, [statisticsDataMode, realEdc]);

  useEffect(() => {
    localStorage.setItem(ALERTS_DATA_MODE_KEY, alertsDataMode);
  }, [alertsDataMode]);

  const edcStatistic = statisticsDataMode === 'real' && realEdc ? realEdc : fakeEdc;

  return (
    <div className='app-shell'>
      <AppHeader
        alertsDataMode={alertsDataMode}
        statisticsDataMode={statisticsDataMode}
        onAlertsDataModeChange={setAlertsDataMode}
        onStatisticsDataModeChange={setStatisticsDataMode}
        isLoadingReal={isLoadingReal}
      />

      <div className='app-shell__content'>
        <Outlet context={{ edcStatistic, isLoadingReal } satisfies OutletContextType} />
      </div>
    </div>
  );
}

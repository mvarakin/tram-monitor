import { useEffect, useMemo, useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';

import { AppHeader } from './AppHeader';
import { generateEdcStatistic } from '../data/generateEdcStatistic';
import { fetchAvailableDates, fetchStatisticsForDate, resolveDate } from '../data/statisticsFiles';

import type { EdcStatistic } from '../types/edcStatistic';
import type { DataMode } from '../types/dataMode';

const STATISTICS_DATA_MODE_KEY = 'statisticsDataMode';
const ALERTS_DATA_MODE_KEY = 'alertsDataMode';

function readStoredDataMode(key: string, fallback: DataMode): DataMode {
  const stored = localStorage.getItem(key);

  if (stored === 'real' || stored === 'fake') {
    return stored;
  }

  return fallback;
}

type OutletContextType = {
  edcStatistic: EdcStatistic;
  isLoadingReal: boolean;
  statisticsDataMode: DataMode;
  availableDates: string[];
};

export function AppLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date') ?? undefined;

  const [statisticsDataMode, setStatisticsDataMode] = useState<DataMode>(() =>
    readStoredDataMode(STATISTICS_DATA_MODE_KEY, 'real')
  );

  const [alertsDataMode, setAlertsDataMode] = useState<DataMode>(() =>
    readStoredDataMode(ALERTS_DATA_MODE_KEY, 'fake')
  );

  const [isLoadingReal, setIsLoadingReal] = useState(false);

  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const fakeEdc = useMemo(() => generateEdcStatistic(date), [date]);

  const [realEdc, setRealEdc] = useState<EdcStatistic | null>(null);

  const resolvedDate = resolveDate(date, availableDates);

  useEffect(() => {
    let cancelled = false;

    fetchAvailableDates()
      .then((dates) => {
        if (!cancelled) {
          setAvailableDates(dates);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (statisticsDataMode !== 'real' || !resolvedDate || date === resolvedDate) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    next.set('date', resolvedDate);

    setSearchParams(next, { replace: true });
  }, [statisticsDataMode, resolvedDate, date, searchParams, setSearchParams]);

  useEffect(() => {
    localStorage.setItem(STATISTICS_DATA_MODE_KEY, statisticsDataMode);

    if (statisticsDataMode !== 'real' || !resolvedDate) {
      return;
    }

    let cancelled = false;

    setIsLoadingReal(true);

    fetchStatisticsForDate(resolvedDate)
      .then((statistic) => {
        if (!cancelled) {
          setRealEdc(statistic);
        }
      })
      .catch((error) => {
        console.error(error);

        if (!cancelled) {
          setRealEdc(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingReal(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [statisticsDataMode, resolvedDate]);

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
        <Outlet
          context={
            { edcStatistic, isLoadingReal, statisticsDataMode, availableDates } satisfies OutletContextType
          }
        />
      </div>
    </div>
  );
}

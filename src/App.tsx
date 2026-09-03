import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import { CarriageAlertsPage } from './pages/CarriageAlertsPage';
import { CarriageStatisticsPage } from './pages/CarriageStatisticsPage';
import { generateAlerts } from './data/generateAlerts';
import { generateEdcStatistic } from './data/generateEdcStatistic';
import { HomePage } from './pages/HomePage';
import { StatisticsPage } from './pages/StatisticsPage';

import type { EdcStatistic } from './types/edcStatistic';
import type { DataMode } from './types/dataMode';

const alerts = generateAlerts();

const DATA_MODE_STORAGE_KEY = 'statisticsDataMode';

function readStoredDataMode(): DataMode {
  return localStorage.getItem(DATA_MODE_STORAGE_KEY) === 'real' ? 'real' : 'fake';
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const [searchParams] = useSearchParams();

  const date = searchParams.get('date') ?? undefined;

  const [dataMode, setDataMode] = useState<DataMode>(readStoredDataMode);

  const [isLoadingReal, setIsLoadingReal] = useState(false);

  const fakeEdc = useMemo(() => generateEdcStatistic(date), [date]);

  const [realEdc, setRealEdc] = useState<EdcStatistic | null>(null);

  useEffect(() => {
    localStorage.setItem(DATA_MODE_STORAGE_KEY, dataMode);

    if (dataMode !== 'real' || realEdc) {
      return;
    }

    let cancelled = false;

    setIsLoadingReal(true);

    import('./data/statistics.json').then((module) => {
      if (cancelled) {
        return;
      }

      setRealEdc(module.default);

      setIsLoadingReal(false);
    });

    return () => {
      cancelled = true;
    };
  }, [dataMode, realEdc]);

  const edcStatistic = dataMode === 'real' && realEdc ? realEdc : fakeEdc;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path='/' element={<HomePage alerts={alerts} />} />

        <Route
          path='/statistics'
          element={
            <StatisticsPage
              edc={edcStatistic}
              dataMode={dataMode}
              onDataModeChange={setDataMode}
              isLoadingReal={isLoadingReal}
            />
          }
        />

        <Route
          path='/carriage/:number/temperature'
          element={<CarriageAlertsPage alerts={alerts} metric='temperature' />}
        />

        <Route
          path='/carriage/:number/voltage'
          element={<CarriageAlertsPage alerts={alerts} metric='voltage' />}
        />

        <Route
          path='/statistics/carriage/:number/temperature'
          element={<CarriageStatisticsPage edc={edcStatistic} metric='temperature' />}
        />

        <Route
          path='/statistics/carriage/:number/voltage'
          element={<CarriageStatisticsPage edc={edcStatistic} metric='voltage' />}
        />
      </Route>
    </Routes>
  );
}

export default App;

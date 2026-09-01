import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import { CarriageAlertsPage } from './pages/CarriageAlertsPage';
import { CarriageStatisticsPage } from './pages/CarriageStatisticsPage';
import { generateAlerts } from './data/generateAlerts';
import { generateEdcStatistic } from './data/generateEdcStatistic';
import { HomePage } from './pages/HomePage';
import { StatisticsPage } from './pages/StatisticsPage';

/*
 * ВРЕМЕННО: в statistics.json нет ни одного критического события, панель событий
 * на нём не появляется. Генератор даёт 5–10 событий на 3 вагона.
 * Вернуть: import edcStatistic from './data/statistics.json';
 */
const edcStatistic = generateEdcStatistic();

const alerts = generateAlerts();

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<HomePage alerts={alerts} />} />

          <Route path='/statistics' element={<StatisticsPage edc={edcStatistic} />} />

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
    </BrowserRouter>
  );
}

export default App;

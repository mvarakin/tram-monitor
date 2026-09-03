import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import { CarriageAlertsPage } from './pages/CarriageAlertsPage';
import { CarriageStatisticsPage } from './pages/CarriageStatisticsPage';
import { generateAlerts } from './data/generateAlerts';
import { HomePage } from './pages/HomePage';
import { StatisticsPage } from './pages/StatisticsPage';

const alerts = generateAlerts();

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<HomePage alerts={alerts} />} />

          <Route path='/statistics' element={<StatisticsPage />} />

          <Route
            path='/carriage/:number/temperature'
            element={<CarriageAlertsPage alerts={alerts} metric='temperature' />}
          />

          <Route
            path='/carriage/:number/voltage'
            element={<CarriageAlertsPage alerts={alerts} metric='voltage' />}
          />

          <Route path='/statistics/carriage/:number/temperature' element={<CarriageStatisticsPage metric='temperature' />} />

          <Route path='/statistics/carriage/:number/voltage' element={<CarriageStatisticsPage metric='voltage' />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

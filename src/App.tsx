import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import { CarriageAlertsPage } from './pages/CarriageAlertsPage';
import { CarriageStatisticsPage } from './pages/CarriageStatisticsPage';
import { HomePage } from './pages/HomePage';
import { StatisticsPage } from './pages/StatisticsPage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<HomePage />} />

          <Route path='/statistics' element={<StatisticsPage />} />

          <Route
            path='/carriage/:number/temperature'
            element={<CarriageAlertsPage metric='temperature' />}
          />

          <Route
            path='/carriage/:number/voltage'
            element={<CarriageAlertsPage metric='voltage' />}
          />

          <Route
            path='/carriage/:number/imbalance'
            element={<CarriageAlertsPage metric='imbalance' />}
          />

          <Route path='/statistics/carriage/:number/temperature' element={<CarriageStatisticsPage metric='temperature' />} />

          <Route path='/statistics/carriage/:number/voltage' element={<CarriageStatisticsPage metric='voltage' />} />

          <Route path='/statistics/carriage/:number/imbalance' element={<CarriageStatisticsPage metric='imbalance' />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

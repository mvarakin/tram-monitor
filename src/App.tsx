import { BrowserRouter, Route, Routes } from 'react-router-dom';

import edcStatistic from './data/edc_statistic';
import { HomePage } from './pages/HomePage';
import { TramPage } from './pages/TramPage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path='/' element={<HomePage edc={edcStatistic} />} />

        <Route
          path='/tram/:id/temperature'
          element={<TramPage edc={edcStatistic} metric='temperature' />}
        />

        <Route
          path='/tram/:id/voltage'
          element={<TramPage edc={edcStatistic} metric='voltage' />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

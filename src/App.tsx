import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CarriagePage } from './pages/CarriagePage';
import edcStatistic from './data/edc_statistic';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path='/' element={<HomePage edc={edcStatistic} />} />

        <Route
          path='/carriage/:number/temperature'
          element={<CarriagePage edc={edcStatistic} metric='temperature' />}
        />

        <Route
          path='/carriage/:number/voltage'
          element={<CarriagePage edc={edcStatistic} metric='voltage' />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

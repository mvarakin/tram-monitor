import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CarriagePage } from './pages/CarriagePage';
import { generateEdcStatistic } from './data/generateEdcStatistic';
import { HomePage } from './pages/HomePage';

/*
 * ВРЕМЕННО: в statistics.json нет ни одного критического события, панель событий
 * на нём не появляется. Генератор даёт 5–10 событий на 3 вагона.
 * Вернуть: import edcStatistic from './data/statistics.json';
 */
const edcStatistic = generateEdcStatistic();

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

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useGetTransportsQuery } from './api/temperatureApi';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  const {
    data: transports,
    isLoading,
    isError,
  } = useGetTransportsQuery(undefined, {
    pollingInterval: 10 * 1000,
  });

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (isError) {
    return <div>Ошибка загрузки данных</div>;
  }

  if (!transports) {
    return null;
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path='/' element={<Navigate to='/temperature' replace />} />
        <Route
          path='/temperature'
          element={<DashboardPage transports={transports} metric='temperature' />}
        />
        <Route path='/speed' element={<DashboardPage transports={transports} metric='speed' />} />
        <Route
          path='/transport/:id/speed'
          element={<DashboardPage transports={transports} metric='speed' />}
        />
        <Route
          path='/transport/:id'
          element={<DashboardPage transports={transports} metric='temperature' />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

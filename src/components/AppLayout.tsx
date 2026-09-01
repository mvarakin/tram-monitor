import { Outlet } from 'react-router-dom';

import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <div className='app-shell'>
      <AppHeader />

      <div className='app-shell__content'>
        <Outlet />
      </div>
    </div>
  );
}

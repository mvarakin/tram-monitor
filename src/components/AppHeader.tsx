import { Link, useLocation } from 'react-router-dom';

export function AppHeader() {
  const { pathname } = useLocation();

  const isMonitoring = pathname === '/' || pathname.startsWith('/carriage');
  const isStatistics = pathname.startsWith('/statistics');

  return (
    <header className='app-header'>
      <nav className='app-header__nav'>
        <Link
          to='/'
          className={`app-header__link${isMonitoring ? ' app-header__link--active' : ''}`}
        >
          Мониторинг на сегодня
        </Link>

        <Link
          to='/statistics'
          className={`app-header__link${isStatistics ? ' app-header__link--active' : ''}`}
        >
          Статистика
        </Link>
      </nav>
    </header>
  );
}

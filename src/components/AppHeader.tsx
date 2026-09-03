import { Link, useLocation } from 'react-router-dom';

import type { DataMode } from '../types/dataMode';

type AppHeaderProps = {
  alertsDataMode: DataMode;
  statisticsDataMode: DataMode;
  onAlertsDataModeChange: (mode: DataMode) => void;
  onStatisticsDataModeChange: (mode: DataMode) => void;
  isLoadingReal: boolean;
};

export function AppHeader({
  alertsDataMode,
  statisticsDataMode,
  onAlertsDataModeChange,
  onStatisticsDataModeChange,
  isLoadingReal,
}: AppHeaderProps) {
  const { pathname } = useLocation();

  const isMonitoring = pathname === '/' || pathname.startsWith('/carriage');
  const isStatistics = pathname.startsWith('/statistics');

  const activeMode = isStatistics ? statisticsDataMode : alertsDataMode;
  const onModeChange = isStatistics ? onStatisticsDataModeChange : onAlertsDataModeChange;
  const disabled = isMonitoring || isLoadingReal;

  return (
    <header className='app-header'>
      <nav className='app-header__nav'>
        <div className='app-header__links'>
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
        </div>

        <div className='data-mode-switch'>
          <button
            type='button'
            className={`data-mode-switch__button${activeMode === 'real' ? ' data-mode-switch__button--active' : ''}`}
            disabled={disabled}
            onClick={() => onModeChange('real')}
          >
            Реальные данные
          </button>

          <button
            type='button'
            className={`data-mode-switch__button${activeMode === 'fake' ? ' data-mode-switch__button--active' : ''}`}
            disabled={disabled}
            onClick={() => onModeChange('fake')}
          >
            Фейк
          </button>
        </div>
      </nav>
    </header>
  );
}

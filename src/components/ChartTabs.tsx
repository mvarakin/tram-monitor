import { Link } from 'react-router-dom';

import { AlertIcon } from './AlertIcon';
import { getSpeedTone, getTemperatureTone } from './thresholds';

import type { Metric } from './ChartPanel';
import type { Transport } from '../types/transport';

type ChartTabsProps = {
  /* null — общая панель: свои адреса и никаких значков тревоги. */
  transport: Transport | null;
  metric: Metric;
};

export function ChartTabs({ transport, metric }: ChartTabsProps) {
  const tabs = [
    {
      metric: 'temperature' as Metric,
      label: 'Температура',
      to: transport ? `/transport/${transport.id}` : '/temperature',
      tone: transport ? getTemperatureTone(transport.temperature) : 'normal',
      alert: 'Перегрев',
    },
    {
      metric: 'speed' as Metric,
      label: 'Скорость',
      to: transport ? `/transport/${transport.id}/speed` : '/speed',
      tone: transport ? getSpeedTone(transport.speed) : 'normal',
      alert: 'Превышение скорости',
    },
  ];

  return (
    <nav className='chart-tabs'>
      {tabs.map((tab) => {
        /*
         * Активность считаем по metric из роута, а не через
         * NavLink: /transport/:id — префикс /transport/:id/speed,
         * и NavLink подсветил бы обе вкладки сразу.
         */
        const isActive = tab.metric === metric;

        const hasAlert = tab.tone !== 'normal';

        const className = [
          'chart-tab',
          isActive ? 'chart-tab--active' : '',
          hasAlert ? `chart-tab--${tab.tone}` : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Link
            key={tab.metric}
            to={tab.to}
            className={className}
            title={hasAlert ? tab.alert : undefined}
            aria-current={isActive ? 'page' : undefined}>
            {tab.label}

            {hasAlert && <AlertIcon />}
          </Link>
        );
      })}
    </nav>
  );
}

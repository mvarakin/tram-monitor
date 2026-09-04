import type { MinuteAlertView } from './useMinuteAlertView';

type MinuteAlertViewSwitchProps = {
  view: MinuteAlertView;
  onViewChange: (view: MinuteAlertView) => void;
};

const ICON_SIZE = 14;

function PieIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox='0 0 16 16' aria-hidden='true'>
      <circle cx='8' cy='8' r='6.5' fill='none' stroke='currentColor' strokeWidth='1.5' />
      <path d='M8 8 L8 1.5 A 6.5 6.5 0 0 1 14.5 8 Z' fill='currentColor' />
    </svg>
  );
}

function BarsIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox='0 0 16 16' aria-hidden='true'>
      <rect x='2' y='9' width='3' height='5' fill='currentColor' />
      <rect x='6.5' y='5' width='3' height='9' fill='currentColor' />
      <rect x='11' y='2' width='3' height='12' fill='currentColor' />
    </svg>
  );
}

/** Переключатель вида минутной сводки алертов: круговая диаграмма или гистограмма. */
export function MinuteAlertViewSwitch({ view, onViewChange }: MinuteAlertViewSwitchProps) {
  const buttonClassName = (target: MinuteAlertView) =>
    `chart-tooltip__view-switch-button${
      view === target ? ' chart-tooltip__view-switch-button--active' : ''
    }`;

  return (
    <div className='chart-tooltip__view-switch'>
      <button
        type='button'
        className={buttonClassName('ring')}
        title='Круговая диаграмма'
        aria-label='Круговая диаграмма'
        aria-pressed={view === 'ring'}
        onClick={() => onViewChange('ring')}>
        <PieIcon />
      </button>

      <button
        type='button'
        className={buttonClassName('bars')}
        title='Гистограмма'
        aria-label='Гистограмма'
        aria-pressed={view === 'bars'}
        onClick={() => onViewChange('bars')}>
        <BarsIcon />
      </button>
    </div>
  );
}

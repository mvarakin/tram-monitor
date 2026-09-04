import { useCallback, useState } from 'react';

export type MinuteAlertView = 'ring' | 'bars';

const MINUTE_ALERT_VIEW_KEY = 'minuteAlertView';

function readStoredView(): MinuteAlertView {
  return localStorage.getItem(MINUTE_ALERT_VIEW_KEY) === 'bars' ? 'bars' : 'ring';
}

/**
 * Вид минутной сводки алертов в тултипе. Хранится в localStorage, а не в состоянии тултипа:
 * тултип размонтируется при закрытии, а выбранный вид должен переживать это и применяться
 * ко всем следующим тултипам.
 */
export function useMinuteAlertView(): [MinuteAlertView, (view: MinuteAlertView) => void] {
  const [view, setView] = useState<MinuteAlertView>(readStoredView);

  const changeView = useCallback((next: MinuteAlertView) => {
    localStorage.setItem(MINUTE_ALERT_VIEW_KEY, next);

    setView(next);
  }, []);

  return [view, changeView];
}

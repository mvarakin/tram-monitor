import { useEffect, useMemo, useState } from 'react';

import { ALERTS_PAGE_SIZE, ALERTS_POLL_INTERVAL_MS } from '../constants';
import { alertsStartDate, fetchAlertsPage, getUtcDayStart, mergeAlerts } from './alertsApi';
import { generateAlerts } from './generateAlerts';

import type { AlertsSortValue } from './alertsApi';
import type { Alert } from '../types/alert';
import type { DataMode } from '../types/dataMode';

type AlertsState = {
  alerts: Alert[];
  isLoadingAlerts: boolean;
};

const EMPTY_ALERTS: Alert[] = [];

/*
 * real: опрос POST /api/v1/alert раз в ALERTS_POLL_INTERVAL_MS. start_date — всегда UTC-полночь
 * текущих суток, вперёд двигается только курсор sortValue из последнего ответа (null, пока
 * ответов не было). За тик страницы догружаются, пока не придёт неполная — меньше
 * ALERTS_PAGE_SIZE. Следующий тик планируется только после ответа на предыдущий, поэтому
 * запросы не наслаиваются. Ошибка не рвёт цикл: следующий тик повторяет запрос с последним
 * полученным курсором. С наступлением новых UTC-суток список и курсор сбрасываются.
 */
export function useAlerts(mode: DataMode): AlertsState {
  const fakeAlerts = useMemo(() => generateAlerts(), []);

  const [realAlerts, setRealAlerts] = useState<Alert[]>(EMPTY_ALERTS);

  const [isLoadingAlerts, setIsLoadingAlerts] = useState(() => mode === 'real');

  useEffect(() => {
    if (mode !== 'real') {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    let alerts: Alert[] = EMPTY_ALERTS;
    let cursor: AlertsSortValue | null = null;
    let windowDayStart = getUtcDayStart(Date.now());

    setRealAlerts(EMPTY_ALERTS);
    setIsLoadingAlerts(true);

    async function poll() {
      const now = Date.now();
      const dayStart = getUtcDayStart(now);

      if (dayStart !== windowDayStart) {
        windowDayStart = dayStart;
        alerts = EMPTY_ALERTS;
        cursor = null;
        setRealAlerts(alerts);
      }

      const startDate = alertsStartDate(now);

      controller = new AbortController();

      try {
        for (;;) {
          const page = await fetchAlertsPage(startDate, cursor, controller.signal);

          if (cancelled) {
            return;
          }

          alerts = mergeAlerts(alerts, page.alerts);
          setRealAlerts(alerts);

          // Без курсора дальше листать нечем — на следующем тике повторим с прежним.
          if (page.sortValue === null) {
            break;
          }

          cursor = page.sortValue;

          if (page.alerts.length < ALERTS_PAGE_SIZE) {
            break;
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(error);
      }

      setIsLoadingAlerts(false);

      timer = setTimeout(poll, ALERTS_POLL_INTERVAL_MS);
    }

    void poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
    };
  }, [mode]);

  if (mode === 'fake') {
    return { alerts: fakeAlerts, isLoadingAlerts: false };
  }

  return { alerts: realAlerts, isLoadingAlerts };
}

import { useEffect, useMemo, useState } from 'react';

import { ALERTS_POLL_INTERVAL_MS } from '../constants';
import { fetchAlerts, getUtcDayStart, initialAlertsStart, latestTimestamp, mergeAlerts } from './alertsApi';
import { generateAlerts } from './generateAlerts';

import type { Alert } from '../types/alert';
import type { DataMode } from '../types/dataMode';

type AlertsState = {
  alerts: Alert[];
  isLoadingAlerts: boolean;
};

const EMPTY_ALERTS: Alert[] = [];

/*
 * real: опрос GET /api/v1/alert раз в ALERTS_POLL_INTERVAL_MS. start — timestamp последнего
 * полученного алерта, а пока их нет — UTC-полночь. Следующий запрос планируется только после
 * ответа на предыдущий, поэтому запросы не наслаиваются. Ошибка не рвёт цикл: следующий тик
 * повторяет запрос с тем же start. С наступлением новых UTC-суток список и курсор сбрасываются.
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
    let windowDayStart = getUtcDayStart(Date.now());

    setRealAlerts(EMPTY_ALERTS);
    setIsLoadingAlerts(true);

    async function poll() {
      const now = Date.now();
      const dayStart = getUtcDayStart(now);

      if (dayStart !== windowDayStart) {
        windowDayStart = dayStart;
        alerts = EMPTY_ALERTS;
        setRealAlerts(alerts);
      }

      const start = latestTimestamp(alerts) ?? initialAlertsStart(now);

      controller = new AbortController();

      try {
        const incoming = await fetchAlerts(start, controller.signal);

        if (cancelled) {
          return;
        }

        alerts = mergeAlerts(alerts, incoming);
        setRealAlerts(alerts);
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

import type { Alert } from './alert';
import type { DataMode } from './dataMode';
import type { EdcStatistic } from './edcStatistic';

export type OutletContextType = {
  edcStatistic: EdcStatistic;
  isLoadingReal: boolean;
  statisticsDataMode: DataMode;
  availableDates: string[];
  alerts: Alert[];
  isLoadingAlerts: boolean;
};

export type AlertType = 'TEMPERATURE' | 'VOLTAGE' | 'IMBALANCE';

/** См. src/data/edc_alert_desc.ts — формат задан бэкендом. */
export type Alert = {
  type: AlertType;
  timestamp: string;
  carriage_number: string;
  carriage_type: string;
  battery_number: string;
  temperature: number;
  voltage: number;
  imbalance: number;
};
